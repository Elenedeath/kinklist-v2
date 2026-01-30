<template>
  <Dialog
    :titleText="language === 'fr' ? 'Erreur' : 'Error'"
    @close="close()"
  >
    <div class="error-dialog-content">
      {{ message }}
    </div>
  </Dialog>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from "vue-property-decorator";

import Dialog from "./Dialog.vue";

@Component({
  components: {
    Dialog,
  },
})
export default class ErrorDialog extends Vue {
  @Prop() message!: string;
  @Prop({ default: 'en' }) language!: 'en' | 'fr';

  @Emit()
  close(): void { /* Event emitted */ }
}
</script>

<style lang="scss" scoped>
.error-dialog-content {
  width: 400px;
  padding: 10px;
}
</style>
