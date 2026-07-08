import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { fetchVenues } from "@/services/api/venuesApi";
import {
  CAMPUS_ACCESSIBLE_ROUTES,
  CAMPUS_BUILDING_OUTLINES,
  CAMPUS_CATEGORY_CONFIG,
  CAMPUS_CATEGORY_ORDER,
  enrichWithNetworkVenues,
  type CampusCategory,
  type CampusLocation
} from "@/features/map/campusMapData";
import {
  buildMapEntityIndex,
  mapEntityKey,
  searchMapEntities,
  type MapSearchEntity
} from "@/features/map/mapSearch";
import "./ModernMap.css";

type CategoryFilter = "all" | CampusCategory;

const CATEGORY_FILTERS: CategoryFilter[] = ["all", ...CAMPUS_CATEGORY_ORDER];
const SEARCH_DEBOUNCE_MS = 150;
const SEARCH_RESULT_LIMIT = 50;

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  color: string;
  action: () => void;
}

interface MapViewState {
  isFullscreen: boolean;
  showFilters: boolean;
  showRoutePanel: boolean;
  userLocation: [number, number] | null;
}

export default function ModernMap() {
  const navigate = useNavigate();

  // State
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [viewState, setViewState] = useState<MapViewState>({
    isFullscreen: false,
    showFilters: true,
    showRoutePanel: false,
    userLocation: null
  });
  const [networkVenues, setNetworkVenues] = useState<ReturnType<typeof enrichWithNetworkVenues>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<MapSearchEntity | null>(null);

  // Load venues
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const result = await fetchVenues();
      if (!mounted) return;
      const locations = enrichWithNetworkVenues(result.venues);
      setNetworkVenues(locations);
      setLoading(false);
    };
    void load();
    return () => { mounted = false; };
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Build search index
  const entityIndex = useMemo(
    () => buildMapEntityIndex(networkVenues, CAMPUS_BUILDING_OUTLINES, CAMPUS_ACCESSIBLE_ROUTES),
    [networkVenues]
  );

  // Search results
  const searchResults = useMemo(
    () => searchMapEntities(debouncedQuery, entityIndex, { category: activeCategory, limit: SEARCH_RESULT_LIMIT }),
    [debouncedQuery, entityIndex, activeCategory]
  );

  // Selected location details
  const selectedLocation = useMemo(() => {
    if (!selectedEntity || selectedEntity.ref.type !== "location") return null;
    return networkVenues.find(loc => loc.id === selectedEntity.ref.id) || null;
  }, [selectedEntity, networkVenues]);

  // Quick actions
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'locate',
      icon: 'my_location',
      label: 'Find Me',
      color: 'var(--color-primary)',
      action: () => locateUser()
    },
    {
      id: 'coffee',
      icon: 'local_cafe',
      label: 'Coffee Spots',
      color: '#8B4513',
      action: () => {
        setQuery('coffee cafe');
        setActiveCategory('canteen');
      }
    },
    {
      id: 'study',
      icon: 'menu_book',
      label: 'Study Areas',
      color: 'var(--color-secondary)',
      action: () => {
        setQuery('library study quiet');
        setActiveCategory('academic');
      }
    },
    {
      id: 'food',
      icon: 'restaurant',
      label: 'Food',
      color: '#FF6B6B',
      action: () => {
        setQuery('');
        setActiveCategory('canteen');
      }
    },
    {
      id: 'directions',
      icon: 'directions',
      label: 'Directions',
      color: '#4CAF50',
      action: () => setViewState(prev => ({ ...prev, showRoutePanel: true }))
    }
  ], []);

  // Locate user
  const locateUser = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("Location services not available");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setViewState(prev => ({ ...prev, userLocation: coords }));
        
        // Find nearest location
        const nearest = networkVenues.reduce((closest, location) => {
          const dist = Math.sqrt(
            Math.pow(location.position[0] - coords[0], 2) + 
            Math.pow(location.position[1] - coords[1], 2)
          );
          return !closest || dist < closest.distance ? { location, distance: dist } : closest;
        }, null as { location: CampusLocation; distance: number } | null);

        if (nearest) {
          setQuery(nearest.location.name);
        }
      },
      () => alert("Unable to get your location"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [networkVenues]);

  // Handle entity selection
  const handleSelectEntity = useCallback((entity: MapSearchEntity) => {
    setSelectedEntity(entity);
    setViewState(prev => ({ ...prev, showRoutePanel: true }));
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery("");
    setSelectedEntity(null);
    setViewState(prev => ({ ...prev, showRoutePanel: false }));
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setViewState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);

  // Toggle filters
  const toggleFilters = useCallback(() => {
    setViewState(prev => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  // Get entity icon
  const getEntityIcon = useCallback((entity: MapSearchEntity): string => {
    if (entity.ref.type === "location") {
      const location = networkVenues.find(loc => loc.id === entity.ref.id);
      return location ? CAMPUS_CATEGORY_CONFIG[location.category].icon : 'place';
    }
    return entity.ref.type === "outline" ? 'domain' : 'route';
  }, [networkVenues]);

  if (loading) {
    return (
      <div className="map-loading">
        <div className="loading-spinner" />
        <p>Loading campus map...</p>
      </div>
    );
  }

  return (
    <div className={`modern-map ${viewState.isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      <header className="map-header">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <Icon name="arrow_back" size={24} />
          </button>
          <h1>Campus Map</h1>
          <p className="header-subtitle">Find your way around UDSM</p>
        </div>
        
        <div className="header-right">
          <button 
            className="header-action"
            onClick={toggleFullscreen}
            aria-label={viewState.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <Icon name={viewState.isFullscreen ? "fullscreen_exit" : "fullscreen"} size={24} />
          </button>
          <button 
            className="header-action"
            onClick={toggleFilters}
            aria-label={viewState.showFilters ? "Hide filters" : "Show filters"}
          >
            <Icon name="filter_alt" size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="map-container">
        {/* Left Panel - Search & Results */}
        <div className="left-panel">
          {/* Search Bar */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <Icon name="search" size={20} className="search-icon" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search buildings, rooms, cafes, libraries..."
                className="search-input"
                aria-label="Search campus map"
              />
              {query && (
                <button 
                  className="clear-search"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  <Icon name="close" size={18} />
                </button>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="quick-actions-bar">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  className="quick-action-btn"
                  onClick={action.action}
                  style={{ '--action-color': action.color } as any}
                >
                  <Icon name={action.icon} size={20} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filters */}
          {viewState.showFilters && (
            <div className="category-filters">
              <div className="filters-scroll">
                {CATEGORY_FILTERS.map(category => {
                  const isActive = category === activeCategory;
                  const label = category === "all" ? "All" : CAMPUS_CATEGORY_CONFIG[category].label;
                  const icon = category === "all" ? "apps" : CAMPUS_CATEGORY_CONFIG[category].icon;
                  
                  return (
                    <button
                      key={category}
                      className={`category-filter ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveCategory(category)}
                      aria-label={`Filter by ${label}`}
                    >
                      <Icon name={icon} size={20} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="search-results">
            <div className="results-header">
              <h3>Search Results</h3>
              <span className="results-count">{searchResults.length} found</span>
            </div>
            
            <div className="results-list">
              {searchResults.length === 0 ? (
                <div className="empty-results">
                  <Icon name="search_off" size={48} />
                  <p>No results found</p>
                  <p className="empty-hint">Try searching for buildings, cafes, or libraries</p>
                </div>
              ) : (
                searchResults.map(entity => {
                  const isSelected = selectedEntity && mapEntityKey(selectedEntity.ref) === mapEntityKey(entity.ref);
                  
                  return (
                    <button
                      key={mapEntityKey(entity.ref)}
                      className={`result-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectEntity(entity)}
                    >
                      <div className="result-icon">
                        <Icon name={getEntityIcon(entity)} size={20} />
                      </div>
                      <div className="result-content">
                        <h4>{entity.title}</h4>
                        <p className="result-subtitle">{entity.subtitle}</p>
                        <div className="result-tags">
                          <span className="result-tag">
                            {entity.ref.type === "location" ? "Location" : 
                             entity.ref.type === "outline" ? "Building" : "Route"}
                          </span>
                          {entity.ref.type === "location" && (
                            <span className="result-tag category">
                              {CAMPUS_CATEGORY_CONFIG[networkVenues.find(l => l.id === entity.ref.id)?.category || 'academic'].label}
                            </span>
                          )}
                        </div>
                      </div>
                      <Icon name="chevron_right" size={20} className="result-arrow" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Center Panel - Map */}
        <div className="center-panel">
          <div className="map-wrapper">
            {/* Map placeholder - In real app, integrate Leaflet here */}
            <div className="map-placeholder">
              <div className="map-overlay">
                <Icon name="map" size={64} />
                <h3>Interactive Campus Map</h3>
                <p>Select a location from search results to view details</p>
                
                {viewState.userLocation && (
                  <div className="user-location-badge">
                    <Icon name="my_location" size={16} />
                    <span>Your location</span>
                  </div>
                )}
              </div>
              
              {/* Map controls */}
              <div className="map-controls">
                <button className="map-control" onClick={locateUser}>
                  <Icon name="my_location" size={20} />
                </button>
                <button className="map-control" onClick={() => setViewState(prev => ({ ...prev, showRoutePanel: true }))}>
                  <Icon name="directions" size={20} />
                </button>
                <button className="map-control" onClick={toggleFullscreen}>
                  <Icon name="zoom_out_map" size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Selected Location Details */}
          {selectedEntity && (
            <div className="details-panel">
              <div className="details-header">
                <h3>{selectedEntity.title}</h3>
                <button 
                  className="close-details"
                  onClick={() => setSelectedEntity(null)}
                  aria-label="Close details"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>
              
              {selectedLocation && (
                <div className="location-details">
                  <div className="detail-section">
                    <div className="detail-row">
                      <Icon name="category" size={18} />
                      <span>{CAMPUS_CATEGORY_CONFIG[selectedLocation.category].label}</span>
                    </div>
                    
                    {selectedLocation.openingHours && (
                      <div className="detail-row">
                        <Icon name="schedule" size={18} />
                        <span>{selectedLocation.openingHours}</span>
                      </div>
                    )}
                    
                    {selectedLocation.building && (
                      <div className="detail-row">
                        <Icon name="apartment" size={18} />
                        <span>{selectedLocation.building}</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedLocation.description && (
                    <div className="detail-section">
                      <p className="description">{selectedLocation.description}</p>
                    </div>
                  )}
                  
                  {selectedLocation.facilities && selectedLocation.facilities.length > 0 && (
                    <div className="detail-section">
                      <h4>Facilities</h4>
                      <div className="facilities-list">
                        {selectedLocation.facilities.map(facility => (
                          <span key={facility} className="facility-tag">
                            {facility}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="detail-actions">
                    <button className="action-btn primary">
                      <Icon name="directions" size={18} />
                      <span>Get Directions</span>
                    </button>
                    <button className="action-btn secondary">
                      <Icon name="share" size={18} />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Route & Info */}
        {viewState.showRoutePanel && (
          <div className="right-panel">
            <div className="panel-header">
              <h3>Directions</h3>
              <button 
                className="close-panel"
                onClick={() => setViewState(prev => ({ ...prev, showRoutePanel: false }))}
                aria-label="Close panel"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            
            <div className="route-panel">
              {selectedEntity ? (
                <>
                  <div className="route-inputs">
                    <div className="route-input">
                      <Icon name="my_location" size={20} />
                      <input 
                        type="text" 
                        placeholder="Current location" 
                        defaultValue={viewState.userLocation ? "Your location" : "Main Gate"}
                      />
                    </div>
                    <div className="route-input">
                      <Icon name="place" size={20} />
                      <input 
                        type="text" 
                        value={selectedEntity.title}
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div className="route-estimate">
                    <div className="estimate-item">
                      <Icon name="schedule" size={20} />
                      <div>
                        <span className="estimate-value">15 min</span>
                        <span className="estimate-label">Walking time</span>
                      </div>
                    </div>
                    <div className="estimate-item">
                      <Icon name="directions_walk" size={20} />
                      <div>
                        <span className="estimate-value">1.2 km</span>
                        <span className="estimate-label">Distance</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="start-route-btn">
                    <Icon name="play_arrow" size={20} />
                    <span>Start Navigation</span>
                  </button>
                </>
              ) : (
                <div className="empty-route">
                  <Icon name="explore" size={48} />
                  <p>Select a destination to get directions</p>
                </div>
              )}
            </div>
            
            {/* Campus Tips */}
            <div className="campus-tips">
              <h4>Campus Tips</h4>
              <div className="tips-list">
                <div className="tip-item">
                  <Icon name="local_cafe" size={18} />
                  <span>Library cafe has 50% off before 9 AM</span>
                </div>
                <div className="tip-item">
                  <Icon name="wifi" size={18} />
                  <span>CS building has fastest WiFi</span>
                </div>
                <div className="tip-item">
                  <Icon name="elevator" size={18} />
                  <span>Use elevators in Block A for accessibility</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar - Quick Stats */}
      <div className="bottom-bar">
        <div className="bottom-stats">
          <div className="stat-item">
            <Icon name="place" size={16} />
            <span>{networkVenues.length} locations</span>
          </div>
          <div className="stat-item">
            <Icon name="restaurant" size={16} />
            <span>{networkVenues.filter(v => v.category === 'canteen').length} food spots</span>
          </div>
          <div className="stat-item">
            <Icon name="menu_book" size={16} />
            <span>{networkVenues.filter(v => v.category === 'academic').length} study areas</span>
          </div>
          <div className="stat-item">
            <Icon name="wifi" size={16} />
            <span>Free campus WiFi available</span>
          </div>
        </div>
      </div>
    </div>
  );
}