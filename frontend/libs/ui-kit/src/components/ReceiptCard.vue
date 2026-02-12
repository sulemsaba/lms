<template>
  <article class="receipt-card" :data-state="state" aria-label="Submission receipt">
    <header class="receipt-header">
      <h3>Submission Receipt</h3>
      <span class="status" aria-live="polite">{{ statusLabel }}</span>
    </header>

    <dl class="receipt-grid">
      <div>
        <dt>Receipt ID</dt>
        <dd>{{ receiptId }}</dd>
      </div>
      <div>
        <dt>Submission Ref</dt>
        <dd>{{ submissionRef }}</dd>
      </div>
      <div>
        <dt>Timestamp</dt>
        <dd>{{ timestamp }}</dd>
      </div>
    </dl>
  </article>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  state: {
    type: String,
    default: "online"
  },
  receiptId: {
    type: String,
    required: true
  },
  submissionRef: {
    type: String,
    required: true
  },
  timestamp: {
    type: String,
    required: true
  }
});

const statusLabel = computed(() => (props.state === "offline" ? "Saved Offline" : "Synced"));
</script>
