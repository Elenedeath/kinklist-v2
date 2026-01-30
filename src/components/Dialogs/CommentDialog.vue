<template>
  <Dialog
    :titleText="dialogTitle"
    @close="close()"
  >
    <div class="comment-dialog-content">
      <textarea ref="textarea" v-model="displayedComment" />
    </div>
  </Dialog>
</template>

<script lang="ts">
import { InKink, InKinkCategory } from "@/types/kinks";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";

import Dialog from "./Dialog.vue";

@Component({
  components: {
    Dialog,
  },
})
export default class CommentDialog extends Vue {
  @Prop() category!: InKinkCategory;
  @Prop() kink!: InKink;
  @Prop({ default: 'en' }) language!: 'en' | 'fr';

  get dialogTitle(): string {
    const categoryName = this.language === 'fr' && this.category.name_fr ? this.category.name_fr : this.category.name;
    const kinkName = this.language === 'fr' && this.kink.name_fr ? this.kink.name_fr : this.kink.name;
    const prefix = this.language === 'fr' ? 'Commentaire pour' : 'Comment for';
    return `${prefix} ${categoryName}: ${kinkName}`;
  }

  get displayedComment(): string {
    return this.language === 'fr' ? (this.kink.comment_fr || '') : (this.kink.comment || '');
  }

  set displayedComment(value: string) {
    if (this.language === 'fr') {
      this.kink.comment_fr = value;
    } else {
      this.kink.comment = value;
    }
  }

  @Emit()
  close(): void { /* Event emitted */ }

  mounted(): void {
    (this.$refs.textarea as HTMLTextAreaElement)?.focus();
  }
}
</script>

<style lang="scss" scoped>
.comment-dialog-content {
  padding: 10px;

  textarea {
    width: max(100%, 400px);
    height: 100px;
    font-family: Arial;
    font-size: 16px;
  }
}
</style>
