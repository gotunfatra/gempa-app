<template>
  <div class="main-app">
    <h1>Monitoring Gempa Indonesia</h1>
    <GempaCard />
  </div>
</template>

<script setup>
import GempaCard from './components/GempaCard.vue';
</script>

<style>
body { margin: 0; background: #f0f2f5; font-family: sans-serif; }
.main-app { text-align: center; padding-top: 40px; }
h1 { color: #2c3e50; margin-bottom: 30px; }
</style>