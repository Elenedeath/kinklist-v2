<template>
  <Dialog
    :titleText="titleText"
    @close="close()"
  >
    <div class="about-dialog-content">
      <p v-html="paragraph1"></p>
      <p v-html="paragraph2"></p>
      <ul>
        <li><a href="https://github.com/Goctionni/kinklist-v2" target="_blank">Github</a></li>
        <li><a href="https://www.reddit.com/user/Goctionni/" target="_blank">reddit.com/u/Goctionni</a></li>
        <li>Discord: Goctionni#9137</li>
      </ul>
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
export default class AboutDialog extends Vue {
  @Prop() message!: string;
  @Prop({ default: 'en' }) language!: 'en' | 'fr';

  get titleText(): string {
    return this.language === 'fr' ? 'À propos' : 'About';
  }

  get paragraph1(): string {
    if (this.language === 'fr') {
      return `Kinklist a été créé par Goctionni pour aider les gens à communiquer facilement et rapidement leurs préférences. Il est open source sous la licence MIT. Vous êtes donc libre de modifier le code source comme vous le souhaitez. Le crédit est apprécié mais pas obligatoire.`;
    }
    return `Kinklist was created by Goctionni to help people easily and quickly communicate their preferences. It is open source under the MIT license. You are thus free modify source code in any way you wish. Credit is appreciated but not required.`;
  }

  get paragraph2(): string {
    if (this.language === 'fr') {
      return `Si vous avez des questions sur kinklist ou des suggestions, vous pouvez me laisser un message sur Reddit (/u/Goctionni) ou ouvrir une issue sur Github. J'aime toujours entendre parler de gens qui utilisent les choses que j'ai créées, donc si vous utilisez Kinklist pour votre communauté, j'aimerais bien en entendre parler.`;
    }
    return `If you have questions about kinklist, or suggestions, you can leave me a message on Reddit (/u/Goctionni) or an issue on Github. I always enjoy hearing of people using things I made, so if you're using Kinklist for your community- hearing about that is also just lovely.`;
  }

  @Emit()
  close(): void { /* Event emitted */ }
}
</script>

<style lang="scss" scoped>
.about-dialog-content {
  width: 400px;
  width: max(400px, min(80vw, 650px));
  padding: 10px;

  p:first-child {
    margin-top: 0;
  }
}
</style>
