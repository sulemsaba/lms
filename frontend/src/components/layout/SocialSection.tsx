import { useState } from "react";
import Icon from "@/components/ui/Icon";
import styles from "./SocialSection.module.css";

interface StudyGroup {
  id: string;
  name: string;
  course: string;
  memberCount: number;
  active: boolean;
  lastActivity: string;
}

interface OnlineFriend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'offline';
  activity: string;
}

interface CampusEvent {
  id: string;
  title: string;
  time: string;
  location: string;
  type: 'academic' | 'social' | 'sports';
}

export default function SocialSection() {
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([
    { id: '1', name: 'Calculus Crew', course: 'MATH 101', memberCount: 8, active: true, lastActivity: '5 min ago' },
    { id: '2', name: 'CS Study', course: 'CS 201', memberCount: 12, active: true, lastActivity: '15 min ago' },
    { id: '3', name: 'Physics Lab', course: 'PHY 102', memberCount: 6, active: false, lastActivity: '2 hours ago' },
  ]);

  const [onlineFriends] = useState<OnlineFriend[]>([
    { id: '1', name: 'Alex Chen', avatar: 'code', status: 'online', activity: 'Studying CS' },
    { id: '2', name: 'Maria Garcia', avatar: 'science', status: 'online', activity: 'In lab' },
    { id: '3', name: 'David Kim', avatar: 'school', status: 'idle', activity: 'Away' },
    { id: '4', name: 'Sarah Jones', avatar: 'work', status: 'offline', activity: 'Last seen 2h ago' },
  ]);

  const [campusEvents] = useState<CampusEvent[]>([
    { id: '1', title: 'AI Workshop', time: '3:00 PM', location: 'Tech Hall', type: 'academic' },
    { id: '2', title: 'Basketball Game', time: '6:00 PM', location: 'Sports Complex', type: 'sports' },
    { id: '3', title: 'Campus Tour', time: '10:00 AM', location: 'Main Gate', type: 'social' },
  ]);

  const [activeTab, setActiveTab] = useState<'groups' | 'friends' | 'events'>('groups');
  const [isExpanded, setIsExpanded] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const handleJoinGroup = (groupId: string) => {
    setStudyGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, active: true, memberCount: group.memberCount + 1 }
          : group
      )
    );
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In real app, send to API
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'var(--color-success)';
      case 'idle': return 'var(--color-warning)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'academic': return 'school';
      case 'social': return 'groups';
      case 'sports': return 'sports';
      default: return 'event';
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>Community</h3>
          <div className={styles.onlineIndicator}>
            <div className={styles.onlineDot} />
            <span className={styles.onlineCount}>
              {onlineFriends.filter(f => f.status === 'online').length} online
            </span>
          </div>
        </div>
        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse community section" : "Expand community section"}
        >
          <Icon name={isExpanded ? "expand_less" : "expand_more"} size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'groups' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <Icon name="groups" size={18} />
          <span>Groups</span>
          {studyGroups.filter(g => g.active).length > 0 && (
            <span className={styles.tabBadge}>
              {studyGroups.filter(g => g.active).length}
            </span>
          )}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'friends' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <Icon name="person" size={18} />
          <span>Friends</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'events' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <Icon name="event" size={18} />
          <span>Events</span>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={styles.content}>
          {/* Study Groups */}
          {activeTab === 'groups' && (
            <div className={styles.groupsList}>
              {studyGroups.map(group => (
                <div key={group.id} className={styles.groupItem}>
                  <div className={styles.groupIcon}>
                    <Icon name="group" size={24} />
                  </div>
                  <div className={styles.groupInfo}>
                    <div className={styles.groupName}>{group.name}</div>
                    <div className={styles.groupDetails}>
                      <span className={styles.groupCourse}>{group.course}</span>
                      <span className={styles.groupMembers}>
                        <Icon name="people" size={12} />
                        {group.memberCount}
                      </span>
                      <span className={styles.groupActivity}>
                        {group.lastActivity}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`${styles.joinButton} ${group.active ? styles.joined : ''}`}
                    onClick={() => handleJoinGroup(group.id)}
                    disabled={group.active}
                  >
                    {group.active ? 'Joined' : 'Join'}
                    {group.active && <Icon name="check" size={14} />}
                  </button>
                </div>
              ))}
              <button className={styles.discoverButton}>
                <Icon name="explore" size={16} />
                Discover more groups
              </button>
            </div>
          )}

          {/* Online Friends */}
          {activeTab === 'friends' && (
            <div className={styles.friendsList}>
              {onlineFriends.map(friend => (
                <div key={friend.id} className={styles.friendItem}>
                  <div className={styles.friendAvatar}>
                    <Icon name={friend.avatar} size={24} />
                    <div 
                      className={styles.statusIndicator}
                      style={{ backgroundColor: getStatusColor(friend.status) }}
                    />
                  </div>
                  <div className={styles.friendInfo}>
                    <div className={styles.friendName}>{friend.name}</div>
                    <div className={styles.friendActivity}>{friend.activity}</div>
                  </div>
                  <button className={styles.messageButton}>
                    <Icon name="chat" size={16} />
                  </button>
                </div>
              ))}
              
              {/* Quick Message */}
              <div className={styles.quickMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message a friend..."
                  className={styles.messageInput}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  className={styles.sendButton}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Icon name="send" size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Campus Events */}
          {activeTab === 'events' && (
            <div className={styles.eventsList}>
              {campusEvents.map(event => (
                <div key={event.id} className={styles.eventItem}>
                  <div className={`${styles.eventIcon} ${styles[event.type]}`}>
                    <Icon name={getEventIcon(event.type)} size={20} />
                  </div>
                  <div className={styles.eventInfo}>
                    <div className={styles.eventTitle}>{event.title}</div>
                    <div className={styles.eventDetails}>
                      <span className={styles.eventTime}>
                        <Icon name="schedule" size={12} />
                        {event.time}
                      </span>
                      <span className={styles.eventLocation}>
                        <Icon name="location_on" size={12} />
                        {event.location}
                      </span>
                    </div>
                  </div>
                  <button className={styles.rsvpButton}>
                    RSVP
                  </button>
                </div>
              ))}
              <button className={styles.viewAllButton}>
                <Icon name="calendar_month" size={16} />
                View full calendar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button className={styles.quickAction}>
          <Icon name="add" size={18} />
          <span>New Group</span>
        </button>
        <button className={styles.quickAction}>
          <Icon name="search" size={18} />
          <span>Find Friends</span>
        </button>
        <button className={styles.quickAction}>
          <Icon name="notifications" size={18} />
          <span>Events</span>
        </button>
      </div>
    </div>
  );
}