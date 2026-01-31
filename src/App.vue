<template>
  <div>
    <transition name="fade">
      <Importing v-if="importing" :language="language" />
      <div v-else class="app">
      <header>
        <h1>Kinklist</h1>
        <input type="text" v-model="username" :placeholder="language === 'fr' ? 'Entrez un nom d\'utilisateur' : 'Enter username'" />
        <div class="spacer"></div>
        <div class="language-selector">
          <button :class="{ active: language === 'en' }" @click="language = 'en'">EN</button>
          <button :class="{ active: language === 'fr' }" @click="language = 'fr'">FR</button>
        </div>
        <Legend :ratings="ratings" :language="language" @updateRatings="updateRatings($event)" />
        <ExportButton :loading="uploading" :language="language" @click="exportImage()" />
        <DownloadButton :language="language" @click="downloadImage()" />
        <button class="import-button" @click="showImgBBImport = true" :title="language === 'fr' ? 'Importer depuis ImgBB' : 'Import from ImgBB'">
          📥 {{ language === 'fr' ? 'Importer' : 'Import' }}
        </button>
        <div class="dropdown-container">
          <button class="dropdown-toggle hide-text" @click="toggleOptions(true)">Options</button>
          <transition name="fade">
            <div class="options-dropdown" v-if="showOptions">
              <div class="backdrop" @click="toggleOptions(false)"></div>
              <div class="options-dropdown-content">
                <div class="option checkbox">
                  <input type="checkbox" id="darkmode" v-model="darkMode">
                  <label for="darkmode">{{ language === 'fr' ? 'Mode sombre' : 'Dark mode' }}</label>
                </div>
                <div class="option checkbox">
                  <input type="checkbox" id="encodeData" v-model="encodeData">
                  <label for="encodeData">{{ language === 'fr' ? 'Encoder les données' : 'Encode data' }}</label>
                </div>
                <div class="option">
                  <label for="imgbbkey">{{ language === 'fr' ? 'Clé API ImgBB' : 'ImgBB API Key' }}</label>
                  <input type="text" id="imgbbkey" v-model="imgbbKey" :placeholder="language === 'fr' ? 'Clé API pour les uploads ImgBB' : 'API key for ImgBB uploads'" />
                </div>
                <div class="option">
                  <label for="imagename">{{ language === 'fr' ? 'Nom de l\'image' : 'Image Name' }}</label>
                  <input type="text" id="imagename" v-model="imageName" :placeholder="language === 'fr' ? 'Nom de l\'image uploadée' : 'Name for uploaded image'" />
                </div>
                <button class="about-btn" @click="showAbout()">{{ language === 'fr' ? 'À propos' : 'About' }}</button>
              </div>
            </div>
          </transition>
        </div>
      </header>
      <main class="body">
        <div class="column" v-for="(col, i) in displayedColumns" :key="`col-${i}`">
          <Category
            v-for="category in col"
            :key="category.name"
            :category="category"
            :ratings="ratings"
            :language="language"
            @removeCategory="removeCategory(category)"
            @addKink="addKink(category)"
            @removeKink="removeKink(category, $event)"
          />
        </div>
      </main>
      <button class="icon-button add-category-btn add-icon" @click="addCategory()">
        <span class="sr-only tooltip tooltip-left">{{ language === 'fr' ? 'Ajouter une catégorie' : 'Add category' }}</span>
      </button>
    </div>
    </transition>
    <ImgBBImportDialog 
      v-if="showImgBBImport"
      :language="language"
      @close="showImgBBImport = false"
      @imported="handleImgBBImport($event)"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { InKink, InKinkCategory } from "./types/kinks";
import { getDefaultKinkContent, getDefaultRatings } from "./data/default";
import { Rating } from "./types/ratings";
import { generateKinklistImage } from "./util/generateImage";
import { uploadImageToImgbb } from "./util/uploadToImgur";
import { importDataFromImgur } from "./util/importFromImgur";

import { showDialog } from './components/Dialogs/dialog';

import Category from "./components/Category.vue";
import UploadResultDialog from "./components/Dialogs/UploadResultDialog.vue";
import PromptDialog from "./components/Dialogs/PromptDialog.vue";
import ErrorDialog from "./components/Dialogs/ErrorDialog.vue";
import AboutDialog from "./components/Dialogs/AboutDialog.vue";
import EditCategoryDialog from "./components/Dialogs/EditCategoryDialog.vue";
import ImgBBImportDialog from "./components/Dialogs/ImgBBImportDialog.vue";
import ExportButton from "./components/ExportButton.vue";
import DownloadButton from "./components/DownloadButton.vue";
import Importing from "./components/Importing.vue";
import Legend from "./components/Legend.vue";
import { generateId } from "./util/idGenerator";
import { downloadImage } from "./util/downloadImage";

@Component({
  components: {
    Category,
    ExportButton,
    DownloadButton,
    Importing,
    Legend,
    ImgBBImportDialog,
  },
  data() {
    let initialLanguage: 'en' | 'fr' = 'en';
    let initialImgbbKey = '';
    let initialImageName = 'kinklist v2';
    try {
      const saved = localStorage.getItem('kinklist-language');
      if (saved === 'en') {
        initialLanguage = 'en';
      } else if (saved === 'fr') {
        initialLanguage = 'fr';
      }
      const savedKey = localStorage.getItem('kinklist-imgbb-key');
      if (savedKey) {
        initialImgbbKey = savedKey;
      }
      const savedName = localStorage.getItem('kinklist-image-name');
      if (savedName) {
        initialImageName = savedName;
      }
    } catch (e) {
      // localStorage not available
    }
    return {
      language: initialLanguage,
      imgbbKey: initialImgbbKey,
      imageName: initialImageName,
    };
  },
})
export default class App extends Vue {
  ratings: Rating[] = [];
  categories: InKinkCategory[] = [];
  username = "";
  uploadId = "";
  uploading = false;
  importing = false;
  showOptions = false;
  showImgBBImport = false;
  darkMode = false;
  encodeData = true;
  numColumns = 4;
  language: 'en' | 'fr' = 'en';
  imgbbKey = '';
  imageName = 'kinklist v2';

  @Watch('language')
  onLanguageChange(): void {
    localStorage.setItem('kinklist-language', this.language);
  }

  @Watch('imgbbKey')
  onImgbbKeyChange(): void {
    localStorage.setItem('kinklist-imgbb-key', this.imgbbKey);
  }

  @Watch('imageName')
  onImageNameChange(): void {
    localStorage.setItem('kinklist-image-name', this.imageName);
  }

  public get uploadUrl(): string {
    return this.uploadId || '';
  }

  public get columns(): InKinkCategory[][] {
    const cols: InKinkCategory[][] = [];
    const headingHeight = 108;
    const rowHeight = 27;
    const totalHeight =
      this.categories.length * headingHeight +
      this.categories.map((c) => c.kinks).flat().length * rowHeight;

    // Iterate through categories and allocate to columns
    const avgColHeight = totalHeight / this.numColumns;
    let colHeight = 0;
    let col: InKinkCategory[] = [];
    cols.push(col);
    for (const cat of this.categories) {
      const catHeight = headingHeight + cat.kinks.length * rowHeight;
      if (colHeight + catHeight / 2 > avgColHeight) {
        col = [];
        cols.push(col);
        colHeight = 0;
      }
      col.push(cat);
      colHeight += catHeight;
    }
    return cols;
  }

  public get displayedColumns(): InKinkCategory[][] {
    return this.columns;
  }

  public async created(): Promise<void> {
    if (!(await this.tryLoadImgurData())) {
      this.loadDefaults();
    }
    this.updateNumColumns();
    window.addEventListener('resize', () => {
      this.updateNumColumns();
    });
  }

  public mounted(): void {
    // Ensure language is restored from localStorage after all rendering
    try {
      const savedLanguage = localStorage.getItem('kinklist-language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr')) {
        this.language = savedLanguage as 'en' | 'fr';
      }
    } catch (e) {
      // localStorage not available
    }
  }

  public updateNumColumns(): void {
    const screenWidth = Math.min(window.innerWidth, 1740);
    this.numColumns = Math.max(1, Math.floor(screenWidth / 400));
  }

  public downloadImage(): void {
    const canvas = generateKinklistImage(this.categories, this.ratings, this.username, this.encodeData, this.language);
    const filenameWithLang = `kinklist v2 ${this.language.toUpperCase()}.png`;
    downloadImage(canvas, filenameWithLang);
  }

  public async exportImage(): Promise<void> {
    try {
      this.uploading = true;
      const canvas = generateKinklistImage(this.categories, this.ratings, this.username, this.encodeData, this.language);
      const imageNameWithLang = `${this.imageName} ${this.language.toUpperCase()}`;
      const id = await uploadImageToImgbb(canvas, this.imgbbKey, imageNameWithLang);
      const hasAnyComment = this.categories.some((c) => c.kinks.some((k) => k.comment));
      showDialog(UploadResultDialog, { uploadId: id, hasEncodedData: this.encodeData && hasAnyComment, language: this.language });
    } catch (ex) {
      showDialog(ErrorDialog, { message: "Something went wrong uploading the image", language: this.language });
      console.error("Something went wrong uploading kinklist");
      console.error(ex);
    }
    this.uploading = false;
  }

  public showAbout(): void {
    this.toggleOptions(false);
    showDialog(AboutDialog, { language: this.language });
  }

  public async addCategory(): Promise<void> {
    type CategoryModalResult = false | Pick<InKinkCategory, "name" | "subcategories">;
    const result: CategoryModalResult = await showDialog(EditCategoryDialog, { language: this.language });
    if (!result) return;

    this.categories.push({
      id: generateId(),
      name: result.name,
      subcategories: result.subcategories,
      kinks: [{
        id: generateId(),
        name: 'Example kink',
        ratings: {
          General: this.ratings[0].name,
        },
      }],
    });
  }

  public removeCategory(category: InKinkCategory): void {
    this.categories = this.categories.filter(c => c != category);
  }

  public async addKink(category: InKinkCategory): Promise<void> {
    const newKinkName: false | string = await showDialog(PromptDialog, {
      title: this.language === 'fr' ? 'Ajouter un kink' : 'Add kink',
      inputLabel: this.language === 'fr' ? 'Nom du kink :' : 'Kink name:',
      value: '',
      language: this.language,
    });
    if (newKinkName) {
      category.kinks.push({
        id: generateId(),
        name: newKinkName,
        ratings: category.subcategories.reduce((map: Record<string, string>, rating: string): Record<string, string> => {
          return { ...map, [rating]: this.ratings[0].name };
        }, {}),
      });
    }
  }

  public removeKink(category: InKinkCategory, kink: InKink): void {
    category.kinks = category.kinks.filter(ck => ck.id !== kink.id);
  }

  public updateRatings(newRatings: Rating[]): void {
    type KinkRatings = Record<string, string>;
    this.ratings = newRatings.map((r) => ({ ...r }));
    for (const category of this.categories) {
      for (const kink of category.kinks) {
        kink.ratings = category.subcategories.reduce((ratings: KinkRatings, subcategory): KinkRatings => {
          const rating = newRatings.some(nr => nr.name === kink.ratings[subcategory])
            ? kink.ratings[subcategory]
            : newRatings[0].name;
          return {
            ...ratings,
            [subcategory]: rating,
          };
        }, {});
      }
    }
  }

  public toggleOptions(newValue: boolean): void {
    this.showOptions = newValue;
    if (newValue) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  public handleImgBBImport(data: { username: string; categories: InKinkCategory[]; ratings: Rating[]; language?: 'en' | 'fr' }): void {
    try {
      this.showImgBBImport = false;
      this.username = data.username;
      this.categories = data.categories;
      this.ratings = data.ratings;
      // Keep the current language setting, don't change it
    } catch (error) {
      showDialog(ErrorDialog, { 
        message: error instanceof Error ? error.message : "Failed to import from ImgBB", 
        language: this.language 
      });
      console.error("Error importing from ImgBB:", error);
    }
  }

  private async tryLoadImgurData(): Promise<boolean> {
    // Get the hash
    const id = this.getImgurHash();
    // If there is no hash, no download happens
    if (!id) return false;

    try {
      // Download image
      this.importing = true;
      const { categories, ratings, username } = await importDataFromImgur(id);
      this.username = username
      this.categories = categories;
      this.ratings = ratings;
      this.importing = false;
      return true;
    } catch (ex) {
      showDialog(ErrorDialog, { message: "Something went wrong parsing loading kinklist data" });
      console.error("Something went wrong downloading/parsing kinklist");
      console.error(ex);
      this.importing = false;
      return false;
    }
  }

  private getImgurHash(): false | string {
    if (!location.hash) return false;
    if (location.hash.length <= 1) return false;
    if (!location.hash.match(/^#[a-zA-Z0-9]{3,10}$/)) return false;
    const id = location.hash.substr(1);
    return id;
  }

  private loadDefaults(): void {
    this.username = "";
    this.ratings = getDefaultRatings();
    this.categories = getDefaultKinkContent(this.ratings[0].name);
  }

  @Watch('darkMode')
  updateDarkMode(): void {
    if (this.darkMode) document.body.classList.add('theme-dark');
    else document.body.classList.remove('theme-dark');
  }
}
</script>

<style lang="scss">
*,
*::before,
*::after {
  box-sizing: border-box;
}
body,
html {
  font-family: Arial;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  background: #E2E2E8;
}

h1, h2, h3, h4, h5 {
  padding: 0;
  margin: 0;
}

button {
  cursor: pointer;
}

.spacer {
  flex: 1;
}

.hide-text,
.sr-only {
  position: absolute;
  color: transparent;
  font-size: 0;
}

.icon-button {
  border: 0;
  background: transparent;
  position: relative;
}

.icon-button:hover .tooltip {
  position: absolute;
  left: 50%;
  top: 100%;
  margin-top: 4px;
  background-color: #333;
  font-size: 1em;
  color: #FFF;
  white-space: nowrap;
  padding: .25em .5em;
  border-radius: 4px;
  transform: translateX(-50%);
  isolation: isolate;
  pointer-events: none;
  z-index: 1;
  transition: background-color .2s ease-in-out, color .2s ease-in-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    width: 6px;
    height: 6px;
    transform: translate(-50%, -50%) rotate(45deg);
    background: inherit;
    z-index: -1;
    pointer-events: none;
  }

  &.tooltip-left {
    top: 50%;
    left: auto;
    right: 100%;
    margin-top: 0;
    margin-right: 4px;
    transform: translateY(-50%);

    &::before {
      top: 50%;
      left: 100%;
    }
  }
}

.add-icon {
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 10%;
    height: 60%;
    left: 45%;
    top: 20%;
    background-color: currentColor;
    border-radius: 100vh;
  }

  &::after {
    transform: rotate(90deg);
  }
}

.edit-icon {
  &::before,
  &::after {
    --base-transform: translate(-50%, -50%) rotate(45deg);
    content: '';
    position: absolute;
    width: 10%;
    height: 10%;
    left: 50%;
    top: 50%;
    background-color: currentColor;
  }

  &::before {
    transform: var(--base-transform) translateY(-260%);
  }

  &::after {
    height: 57%;
    clip-path: polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%);
    transform: var(--base-transform) translateY(20%);
  }
}

.remove-icon {
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 10%;
    height: 70%;
    left: 45%;
    top: 15%;
    background-color: currentColor;
  }

  &::before {
    transform: rotate(45deg);
  }

  &::after {
    transform: rotate(-45deg);
  }
}

body.theme-dark {
  filter: invert(1) hue-rotate(180deg);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .35s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss" scoped>
.app {
  display: flex;
  flex-direction: column;
  gap: 1em;  
  background: #E2E2E8;
}

header {
  background-color: #EEE;
  display: flex;
  padding: 10px;
  gap: 1em;
  box-shadow: 0 1px 3px rgb(0 0 0 / 12%), 0 1px 2px rgb(0 0 0 / 24%);
}

@media (min-width: 1200px) {
  header {
    --h-padding: calc(calc(100vw - min(100vw, 1700px)) / 2);
    padding-left: var(--h-padding);
    padding-right: var(--h-padding);
  }
}

@media (max-width: 1199px) {
  header {
    flex-direction: column;

    > button {
      height: 37px;
    }
    .dropdown-container {
      height: 37px;
    }
  }
}

.client-id {
  margin-top: .5em;
  font-size: 14px;

  input {
    padding: 4px;
    height: auto;
  }
}

h1 {
  margin: 0;
}

.language-selector {
  display: flex;
  gap: 0;
  border-radius: 4px;
  overflow: hidden;

  button {
    background-color: #DDD;
    border: 1px solid #999;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: normal;
    flex: 0 0 auto;

    &:hover:not(.active) {
      background-color: #CCC;
    }

    &.active {
      background-color: #246;
      color: #FFF;
      font-weight: bold;
    }

    &:first-child {
      border-radius: 4px 0 0 4px;
    }

    &:last-child {
      border-radius: 0 4px 4px 0;
      border-left: none;
    }
  }
}

.import-button {
  background-color: #246;
  color: white;
  border: 1px solid #1a3a52;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 500;
  transition: background-color 0.2s ease-in-out;
  flex: 0 0 auto;

  &:hover {
    background-color: #369;
  }

  &:active {
    background-color: #135;
  }
}

main {
  padding-bottom: 2em;
  display: flex;
  gap: 1em;
  max-width: min(100vw, 1700px);
  width: 100%;
  margin: 0 auto;
}

.dropdown-toggle {
  background-color: #246;
  border: 0;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 37px;

  &::before {
    position: absolute;
    content: '';
    border: solid #FFF 3px;
    border-top-color: transparent;
    border-left-color: transparent;
    width: 40%;
    height: 40%;
    transform: translateY(-25%) rotate(45deg);
  }
}

.dropdown-container {
  position: relative;
}

.backdrop {
  position: fixed;
  background-color: #000;
  opacity: .2;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}
.options-dropdown-content {
  position: absolute;
  margin-top: 10px;
  right: 0;
  width: 200px;
  background-color: #FFF;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  padding: 10px;
  z-index: 2;
}

.option.checkbox {
  input {
    display: none;
  }

  label {
    position: relative;
    cursor: pointer;
    padding-left: calc(20px + .3em);
    height: 24px;
    font-size: 16px;
    line-height: 24px;
    display: block;

    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 2px;
      display: block;
    }

    &::before {
      width: 20px;
      height: 20px;
      border: solid #000 2px;
      transition: background-color .2s ease-in-out;
    }

    &::after {
      width: 0px;
      height: 0px;
      transition: height .2s ease-in, width .2s .2s ease-out;
      border: solid #FFF 2px;
      border-top-color: transparent;
      border-right-color: transparent;
      transform-origin: top left;
      transform: translateY(8px) translateX(3px) rotate(-40deg);
    }
  }

  input:checked + label {
    &::before {
      background-color: #000;
    }

    &::after {
      height: 8px;
      width: 13px;
    }
  }
}

.about-btn {
  border: 0;
  padding-left: calc(20px + 0.3em);
  font-size: 16px;
  line-height: 24px;
  cursor: pointer;
}

input {
  border: solid rgba(0, 0, 0, .25) 1px;
  border-radius: 5px;
  padding: 5px 10px;
  height: 35px;
}

.add-category-btn {
  position: fixed;
  bottom: 1em;
  right: 1em;
  background-color: #246;
  font-size: 1.5em;
  cursor: pointer;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: #FFF;

  &::before,
  &::after {
    transition: transform .3s ease-in-out;
  }

  &:hover {
    background-color: #369;

    &::before {
      transform: rotate(90deg);
    }

    &::after {
      transform: rotate(180deg);
    }
  }
}

.column {
  display: flex;
  flex-direction: column;
  gap: 1em;
  flex: 1;
}
</style>