<template>
  <div class="content">
    <div v-if="supported && checked" class="scanner-media">
      <Scanner
        :disabled="scanDisabled"
        @barcode="onBarcode"
        @disable="scanDisabled = !scanDisabled"
      />
    </div>

    <form @submit.prevent="onSubmit">
      <input
        v-model="currentBarcode"
        :disabled="busy"
        type="text"
        name="barcode"
      />

      <button :disabled="busy">Submit</button>
    </form>

    <form v-if="currentAlbum" @submit.prevent="onIdSubmit">
      <input type="hidden" name="mbid" :value="currentAlbum.data.mbid" />

      <div class="album-preview">
        <div class="album-preview-artwork">
          <img :src="currentAlbum.data.artwork.thumbnails[250]" alt="" />
        </div>
        <span class="album-preview-title">{{ currentAlbum.data.title }}</span>
        <div class="album-preview-artists">
          <span v-for="artist in currentAlbum.data.artists" :key="artist.id">{{
            artist.title
          }}</span>
        </div>
      </div>

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
import { CaptchaMixin } from "~/assets/js/mixins/recaptcha";
import { formToObject } from "~/assets/js/utils";
import Scanner from "~/components/Scanner.vue";

let messageId = 0;

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
      currentAlbum: null,
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
        this.addMessage("Barcode scanned");
      }
    },
    async onSubmit() {
      this.busy = true;
      this.currentAlbum = null;

      try {
        const token = await this.getRecaptcha();

        const { album } = await this.$store.getters
          .search({
            token,
            barcode: this.currentBarcode
          })
          .then(resp => resp.json());

        if (!album) {
          this.addMessage("No album match", "error");
        } else {
          this.addMessage("Album found");
        }

        this.currentAlbum = album;
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
            mbid: data.mbid
          })
          .then(resp => resp.json());

        if (!success) {
          this.addMessage("Album not added", "error");
        } else {
          this.addMessage("Album added");
          this.currentAlbum = null;
          this.currentBarcode = "";
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.busy = false;
      }
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

  button {
    display: block;

    width: 100%;

    padding: 20px;
  }
}

.album-preview {
  display: grid;

  background-color: #f00;
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
