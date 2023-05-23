<template>
  <div class="content">
    <div v-if="supported && checked" class="scanner-media">
      <Scanner
        :disabled="scanDisabled"
        @barcode="onBarcode"
        @disable="scanDisabled = !scanDisabled"
      />
    </div>

    <form v-if="currentAlbums" @submit.prevent="onIdSubmit">
      <label v-for="album in currentAlbums" :key="album.data.mbid">
        <input
          type="radio"
          name="mbid"
          :value="album.data.mbid"
          :checked="currentAlbums.length === 1"
        />

        <div
          class="album-preview"
          :style="
            `--album-color: ${album.data.color ? album.data.color.vibrant : ''}`
          "
        >
          <div class="album-preview-artwork">
            <img
              v-if="album.data.artwork"
              :src="getThumbnail(album.data.artwork.thumbnails)"
              alt=""
            />
          </div>
          <span class="album-preview-title">{{ album.data.title }}</span>
          <div class="album-preview-artists">
            <span v-for="artist in album.data.artists" :key="artist.id">{{
              artist.title
            }}</span>
          </div>
        </div>
      </label>

      <button :disabled="busy">Submit</button>
    </form>

    <form @submit.prevent="onSubmit">
      <button class="mini" type="button" :disabled="busy" @click="onClear">
        Clear
      </button>
      <input
        v-model="currentBarcode"
        :disabled="busy"
        placeholder="Barcode"
        type="search"
        name="barcode"
      />

      <input
        v-model="currentAlbumSearch"
        :disabled="busy"
        type="text"
        name="album"
        placeholder="Album name"
      />

      <input
        v-model="currentArtistSearch"
        :disabled="busy"
        type="text"
        name="artist"
        placeholder="Artist name"
      />

      <button :disabled="busy">Submit</button>
    </form>

    <TransitionGroup name="fade-fast" tag="div" class="messages">
      <div
        v-for="item in messages"
        :key="item.id"
        class="messages-item"
        :class="item.status"
        @click="() => removeMessage(item.id)"
      >
        {{ item.text }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import Vibrant from "node-vibrant";

import { CaptchaMixin } from "~/assets/js/mixins/recaptcha";
import { formToObject, loadImage } from "~/assets/js/utils";
import Scanner from "~/components/Scanner.vue";

let messageId = 0;

const smallImage = async (src, size = 10) => {
  const img = await loadImage(src, true);

  const width = size;
  const height = (size / img.width) * img.height;

  // const canvas = new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 1);
};

export default {
  components: { Scanner },
  mixins: [CaptchaMixin],
  data() {
    return {
      supported: true,
      checked: false,
      currentBarcode: "",
      scanDisabled: false,
      busy: false,
      currentAlbums: null,
      currentAlbumSearch: "",
      currentArtistSearch: "",
      messages: []
    };
  },
  mounted() {
    if (!process.client) {
      return;
    }

    // check compatibility
    if (!("BarcodeDetector" in window)) {
      this.supported = false;
    }

    this.checked = true;
  },
  methods: {
    addMessage(text, status = "success", time = 2000) {
      const item = {
        text,
        status,
        id: messageId
      };

      messageId++;

      this.messages.push(item);

      setTimeout(() => this.removeMessage(item.id), time);
    },
    removeMessage(id) {
      this.messages.splice(
        this.messages.findIndex(item => item.id === id),
        1
      );
    },
    onBarcode(barcode) {
      if (!this.busy && barcode !== this.currentBarcode) {
        this.currentBarcode = barcode;
        this.currentAlbumSearch = "";
        this.currentArtistSearch = "";
        this.addMessage("Barcode scanned");
      }
    },
    async onSubmit(e) {
      const submitData = formToObject(e.target);

      this.busy = true;
      this.currentAlbums = null;

      try {
        const token = await this.getRecaptcha();

        const { albums } = await this.$store.getters
          .search({
            ...submitData,
            token
          })
          .then(resp => resp.json());

        if (!albums || albums.length === 0) {
          this.addMessage("No album match", "error");
        } else {
          this.addMessage("Album found");

          let _albums = albums.slice();

          _albums = await this.getColors(_albums);
          _albums = await this.getArtworks(_albums);

          console.log(_albums);

          this.currentAlbums = _albums;
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.busy = false;
      }
    },
    async onIdSubmit(e) {
      const data = formToObject(e.target);

      this.busy = true;

      try {
        const token = await this.getRecaptcha();

        const { success } = await this.$store.getters
          .add({
            token,
            mbid: data.mbid,
            color: this.currentAlbums.find(
              album => album.data.mbid === data.mbid
            ).data.color,
            images: this.currentAlbums.find(
              album => album.data.mbid === data.mbid
            ).data.images
          })
          .then(resp => resp.json());

        if (!success) {
          this.addMessage("Album not added", "error");
        } else {
          this.addMessage("Album added");
          this.onClear();
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.busy = false;
      }
    },
    async getColors(albums) {
      const colors = await Promise.all(
        albums.map(album => {
          if (!album.data.artwork) {
            return Promise.resolve(false);
          }

          return Vibrant.from(
            this.getThumbnail(album.data.artwork.thumbnails)
          ).getPalette();
        })
      );

      return albums.map((album, idx) => {
        return {
          ...album,
          data: {
            ...album.data,
            color: colors[idx]
              ? {
                  vibrant: colors[idx].Vibrant.hex,
                  light: colors[idx].LightVibrant.hex,
                  dark: colors[idx].DarkVibrant.hex
                }
              : false
          }
        };
      });
    },
    async getArtworks(albums) {
      const small = await Promise.all(
        albums.map(album => {
          if (!album.data.artwork) {
            return Promise.resolve(false);
          }

          return smallImage(this.getThumbnail(album.data.artwork.thumbnails));
        })
      );

      return albums.map((album, idx) => {
        return {
          ...album,
          data: {
            ...album.data,
            images: small[idx]
              ? {
                  small: small[idx],
                  large: this.getThumbnail(album.data.artwork.thumbnails)
                }
              : false
          }
        };
      });
    },
    onClear() {
      this.currentAlbums = null;
      this.currentBarcode = "";
      this.currentAlbumSearch = "";
      this.currentArtistSearch = "";
    },
    getThumbnail(thumbnails) {
      return Object.values(thumbnails).shift();
    }
  }
};
</script>

<style lang="scss" scoped>
.content {
  max-width: 450px;

  margin: 0 auto;
}

.scanner-media {
  width: 100%;

  outline: 1px solid red;

  background-color: black;
}

form {
  margin: 2em 0;

  input {
    width: 100%;

    padding: 10px;
  }

  button:not(.mini) {
    display: block;

    width: 100%;

    padding: 20px;
  }
}

.album-preview {
  display: grid;

  background-color: var(--album-color, #f00);
  padding: 5px;

  grid-template-areas:
    "image title"
    "image artists";
  grid-template-columns: minmax(100px, 10%) 1fr;
  grid-template-rows: auto 1fr;
  gap: 10px;

  &-artwork {
    grid-area: image;

    line-height: 0;
    aspect-ratio: 1;
  }

  &-title {
    grid-area: title;
  }

  &-artists {
    grid-area: artists;

    display: flex;
  }
}

.messages {
  position: fixed;

  bottom: 0;
  left: 0;

  width: 100%;

  &-item {
    padding: 10px;

    margin: 1em;
    box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5);

    &.success {
      color: white;
      background-color: green;
    }

    &.error {
      color: white;
      background-color: red;
    }
  }
}
</style>
