<template>
  <main class="app-shell" aria-label="Student Hub Home">
    <header class="top-bar">
      <h1>UDSM Student Hub</h1>
      <p>Offline-first LMS shell initialized</p>
    </header>

    <section class="offline-banner" v-if="isOffline" aria-live="polite">
      You are offline. Changes are saved and will sync when connected.
    </section>

    <section class="status-card" aria-live="polite">
      <h2>Sync Health</h2>
      <p>Status: <strong>{{ isOffline ? "Offline" : "Online" }}</strong></p>
      <p>Queue depth: {{ queueDepth }}</p>
      <p>Last sync: {{ lastSync }}</p>
    </section>

    <section class="receipt-section">
      <h2>Latest Receipt</h2>
      <ReceiptCard
        :state="isOffline ? 'offline' : 'online'"
        receipt-id="UDSM-2026-000001"
        submission-ref="ASM-DSA-1001"
        timestamp="2026-02-13T08:30:00Z"
      />
    </section>

    <nav class="bottom-nav" aria-label="Primary Navigation">
      <button type="button">Home</button>
      <button type="button">Courses</button>
      <button type="button">Assessments</button>
      <button type="button">Map</button>
      <button type="button">Profile</button>
    </nav>
  </main>
</template>

<script setup>
import { ref } from "vue";
import ReceiptCard from "../../../libs/ui-kit/src/components/ReceiptCard.vue";

const isOffline = ref(false);
const queueDepth = ref(0);
const lastSync = ref("not yet");
</script>
