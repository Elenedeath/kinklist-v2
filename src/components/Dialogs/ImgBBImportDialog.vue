<template>
  <div>
    <div class="dialog-backdrop" @click="$emit('close')"></div>
    <dialog open class="dialog">
      <div class="dialog-header">
        <h1>{{ language === 'fr' ? 'Importer depuis ImgBB' : 'Import from ImgBB' }}</h1>
        <button @click="$emit('close')" class="close-button" :title="language === 'fr' ? 'Fermer' : 'Close'">×</button>
      </div>
      <div class="dialog-content">
        <p>{{ language === 'fr' ? 'Collez le lien ImgBB de votre export kinklist:' : 'Paste the ImgBB link of your kinklist export:' }}</p>
        <input 
          v-model="imgbbUrl" 
          type="text" 
          :placeholder="language === 'fr' ? 'https://i.ibb.co/XXXXX/filename.png' : 'https://i.ibb.co/XXXXX/filename.png'"
          @keyup.enter="importImage"
        />
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
      <div class="dialog-footer">
        <button @click="$emit('close')" class="button secondary">
          {{ language === 'fr' ? 'Annuler' : 'Cancel' }}
        </button>
        <button @click="importImage" class="button primary" :disabled="!imgbbUrl || isLoading">
          {{ isLoading ? (language === 'fr' ? 'Chargement...' : 'Loading...') : (language === 'fr' ? 'Importer' : 'Import') }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { importDataFromImgBB } from "@/util/importFromImgBB";

@Component
export default class ImgBBImportDialog extends Vue {
  @Prop({ default: 'en' }) language!: 'en' | 'fr';

  imgbbUrl = '';
  errorMessage = '';
  isLoading = false;

  async importImage(): Promise<void> {
    if (!this.imgbbUrl) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const data = await importDataFromImgBB(this.imgbbUrl, this.language);
      this.$emit('imported', data);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    } finally {
      this.isLoading = false;
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

.dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  max-width: 90%;
  width: 500px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;

  h1 {
    margin: 0;
    font-size: 1.5rem;
  }
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #999;
  }
}

.dialog-content {
  padding: 1.5rem;

  p {
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.95rem;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #666;
      box-shadow: 0 0 0 2px rgba(100, 100, 100, 0.1);
    }
  }
}

.error-message {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #eee;
}

.button {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: #333;
    color: white;
    border-color: #333;

    &:hover:not(:disabled) {
      background-color: #555;
    }

    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background-color: white;
    color: #333;

    &:hover {
      background-color: #f5f5f5;
    }
  }
}
</style>
