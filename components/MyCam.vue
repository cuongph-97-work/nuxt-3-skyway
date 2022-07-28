<script setup lang="ts">
interface Props {
  src: any
}
const myVideoRef = ref()
const props = defineProps<Props>()
onMounted(() => {
  watch(
    () => props.src,
    (val) => {
      myVideoRef.value.srcObject = val
    },
    {
      immediate: true
    }
  )
})
</script>
<template>
  <div class="cam-container">
    <div class="video">
      <video ref="myVideoRef" muted="true" playsinline autoplay></video>
    </div>
    <div class="content">
      <span class="name">You</span>
    </div>
  </div>
</template>
<style lang="scss"></style>
