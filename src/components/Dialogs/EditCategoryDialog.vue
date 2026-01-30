<template>
  <Dialog
    :titleText="title"
    @close="close()"
  >
    <div class="edit-category-dialog-content">
      <div class="edit-category-body">
        <div class="category-name">
          <label for="NameInput">{{ language === 'fr' ? 'Nom de la catégorie :' : 'Category name:' }}</label>
          <input id="NameInput" type="text" ref="input" v-model="categoryName">
        </div>

        <div class="subcategories-head">
          <label>{{ language === 'fr' ? 'Sous-catégories' : 'Subcategories' }}</label>
          <button class="add-subcategory icon-button add-icon" @click="addSubcategory()">
            <span class="sr-only tooltip">{{ language === 'fr' ? 'Ajouter une sous-catégorie' : 'Add subcategory' }}</span>
          </button>
        </div>
        <ul class="subcategories">
          <li v-for="(subcategory, i) in subcategories" :key="`sucategory-${i}`" class="subcategory">
            <input v-model="subcategories[i]">
            <button class="remove-subcategory icon-button remove-icon" @click="removeSubcategory(i)">
              <span class="sr-only tooltip">{{ language === 'fr' ? 'Supprimer la sous-catégorie' : 'Remove subcategory' }}</span>
            </button>
          </li>
        </ul>
      </div>
      <div class="actions">
        <button class="dialog-action" @click="close()">{{ language === 'fr' ? 'Annuler' : 'Cancel' }}</button>
        <button class="dialog-action action-primary" @click="ok()">{{ language === 'fr' ? 'OK' : 'Ok' }}</button>
      </div>
    </div>
  </Dialog>
</template>

<script lang="ts">
import { InKinkCategory } from "@/types/kinks";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

import Dialog from "./Dialog.vue";

@Component({
  components: {
    Dialog,
  },
})
export default class EditCategoryDialog extends Vue {
  @Prop() category!: InKinkCategory;
  @Prop({ default: 'en' }) language!: 'en' | 'fr';

  categoryName = '';
  subcategories = ['General'];

  get displayName(): string {
    if (!this.category) return '';
    return this.language === 'fr' && this.category.name_fr 
      ? this.category.name_fr 
      : this.category.name;
  }

  get title(): string {
    if (this.category) {
      const categoryName = this.displayName;
      return this.language === 'fr' 
        ? `Éditer la catégorie: ${categoryName}` 
        : `Edit category: ${categoryName}`;
    }
    return this.language === 'fr' ? 'Nouvelle catégorie' : 'New category';
  }

  @Watch('category', { immediate: true })
  updateModel(): void {
    if (!this.category) {
      this.categoryName = '';
      this.subcategories = ['General'];
    } else {
      // Load the appropriate language version of the category name
      this.categoryName = this.language === 'fr' && this.category.name_fr
        ? this.category.name_fr
        : this.category.name;
      // Load the appropriate language version of subcategories
      if (this.language === 'fr' && this.category.subcategories_fr) {
        this.subcategories = this.category.subcategories_fr.slice();
      } else {
        this.subcategories = this.category.subcategories.slice();
      }
    }
  }

  addSubcategory(): void {
    this.subcategories.push('');
  }

  removeSubcategory(index: number): void {
    this.subcategories.splice(index, 1);
  }

  close(): void {
    this.$emit('close', false);
  }

  ok(): void {
    this.$emit('close', {
      name: this.categoryName,
      subcategories: this.subcategories,
    });
  }

  mounted(): void {
    (this.$refs.input as HTMLTextAreaElement)?.focus();
  }
}
</script>

<style lang="scss" scoped>
.edit-category-dialog-content {
  display: flex;
  flex-direction: column;
  padding: 0 10px 10px;
  width: 300px;
  gap: 5px;

}

.edit-category-body,
.category-name {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: bold;
  padding: .25em 0;
}

input {
  font-family: Arial;
  font-size: 16px;
  padding: .25em .5em;
}

.subcategories-head {
  display: flex;
  margin-top: 1em;
  gap: .4em;

  label {
    flex: 1;
  }

  button {
    width: 25px;
    height: 25px;
  }
}

.subcategories {
  display: flex;
  flex-direction: column;
  gap: .4em;
  padding: 0;
  margin: 0 0 .5em;
}

.subcategory {
  display: flex;
  gap: .4em;
  padding: 0;
  margin: 0;

  input {
    flex: 1;
  }

  button {
    width: 30px;
    height: 30px;
  }
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .4em;
}

.dialog-action {
  padding: .35em .7em;
  background-color: #FFF;
  border: solid rgba(0, 0, 0, .2) 1px;
  font-size: 16px;

  &:hover {
    border: solid rgba(0, 0, 0, .4) 1px;
  }

  &.action-primary {
    background-color: #246;
    color: #FFF;
    font-weight: bold;

    &:hover {
      background-color: #369;
    }
  }
}
</style>
