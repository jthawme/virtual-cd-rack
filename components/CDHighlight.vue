<template>
  <div :style="style">
    <div class="image">
      <img
        v-if="!artworkLoaded && loadingImage"
        class="load"
        :src="loadingImage"
      />
      <img v-if="image" :src="image" @load="artworkLoaded = true" />
      <span v-else class="fallback">{{ title }}</span>
    </div>

    <div class="info">
      <div class="trim">
        <span>{{ title }}</span>
      </div>
      <div class="trim">
        <span>{{ artistsString }}</span>
      </div>
    </div>
  </div>
</template>

<script>
const defaultColors = {
  dark: "#111",
  light: "#fff",
  vibrant: "#e5e5e5"
};

export default {
  props: {
    artists: {
      type: Array,
      required: true
    },
    color: {
      type: [Object, Boolean],
      default: null
    },
    artwork: {
      type: [Object, Boolean],
      default: null
    },
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      artworkLoaded: false
    };
  },
  computed: {
    artistsString() {
      return this.artists.join(", ");
    },
    style() {
      return {
        "--color-vibrant": this.color?.vibrant || defaultColors.vibrant,
        "--color-dark": this.color?.dark || defaultColors.dark,
        "--color-light": this.color?.light || defaultColors.light
      };
    },
    loadingImage() {
      if (!this.artwork) {
        return false;
      }

      return this.artwork.small;
    },
    image() {
      if (!this.artwork) {
        return false;
      }

      return this.artwork.large;
    }
  }
};
</script>

<style lang="scss" scoped>
.image {
  background-color: vaR(--color-vibrant);
  line-height: 0;

  padding-bottom: 100%;
  height: 0;

  position: relative;

  img {
    position: absolute;

    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
  }

  .load {
    z-index: 2;

    image-rendering: pixelated;
  }

  .fallback {
    position: absolute;

    top: 50%;
    left: 50%;

    transform: translate3d(-50%, -50%, 0);

    width: 100%;
    text-align: center;

    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    line-height: 1;

    padding: 1rem;

    font-size: 10px;
  }
}

.info {
  background-color: var(--color-light);
  color: var(--color-dark);
  height: calc((var(--size) * 2) * 1px);

  font-size: 10px;

  display: flex;

  flex-direction: column;

  .trim {
    display: flex;

    align-items: center;

    padding: 0 0.5rem;

    height: calc((var(--size) * 1) * 1px);
  }

  span {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}
</style>
