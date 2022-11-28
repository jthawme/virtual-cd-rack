<template>
  <div
    class="cd-outer"
    :style="
      `--album-color: ${color.vibrant};--album-dark-color: ${color.dark};--album-light-color: ${color.light}`
    "
  >
    <div class="cd-inner">
      <div class="cd-blur" />

      <div class="cd-front">
        <div class="cd-front-inner">
          <img v-if="image" :src="image" alt="" />
        </div>
      </div>
      <div class="cd-spine">
        <div class="cd-spine-inner">
          <span class="cd-spine-title">
            {{ title }}
          </span>
          <span class="cd-spine-artists">
            {{ artistsString }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { loadImage } from "~/assets/js/utils";
export default {
  props: {
    artists: {
      type: Array,
      required: true
    },
    artwork: {
      type: [Boolean, Object],
      required: true
    },
    mbid: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    color: {
      type: Object,
      default: () => ({
        vibrant: "red",
        dark: "red",
        light: "red"
      })
    }
  },
  data() {
    return {
      artworkLoaded: false,
      interacted: false
    };
  },
  computed: {
    image() {
      if (!this.artwork) {
        return false;
      }

      if (!this.artworkLoaded) {
        return Object.values(this.artwork.thumbnails).shift();
      }

      return this.artwork.src;
    },
    artistsString() {
      return this.artists.map(item => item.title).join(" / ");
    }
  },
  watch: {
    interacted: {
      immediate: true,
      handler(val) {
        if (val && !this.artworkLoaded && this.image) {
          loadImage(this.artwork.src).then(() => {
            this.artworkLoaded = true;
          });
        }
      }
    }
  }
};
</script>

<style lang="scss">
:root {
  --spine-width: 30px;
}
</style>

<style lang="scss" scoped>
.cd-outer {
  position: relative;

  width: var(--spine-width);
  height: calc(var(--spine-width) * 10.2);

  perspective: 100px;

  &:hover,
  &:focus-visible {
    .cd-inner {
      transform: translate3d(calc(100% - var(--spine-width)), 0, 0);
    }

    .cd-blur {
      opacity: 1;
    }

    .cd-spine {
      transform: rotateY(65deg);
    }

    .cd-front {
      transform: rotateY(-5deg);
    }
  }
}

.cd-inner {
  position: absolute;

  top: 0;
  right: 0;

  width: calc(var(--spine-width) * 11.2);
  height: 100%;

  display: grid;

  grid-template-columns: 1fr var(--spine-width);
}

.cd-blur {
  position: absolute;

  top: 0;
  left: 0;

  width: calc(100% - var(--spine-width));
  height: 100%;

  transform: scaleX(1.05);
  transform-origin: left;

  background: linear-gradient(
    to left,
    rgba(0, 0, 0, 0.75),
    rgba(0, 0, 0, 0.35)
  );
  filter: blur(5px);

  opacity: 0;

  z-index: 1;
}

.cd-inner,
.cd-spine,
.cd-front {
  transition: {
    duration: 0.75s;
    property: transform;
  }
}

.cd-blur {
  transition: {
    duration: 0.75s;
    property: opacity;
  }
}

.cd-front {
  position: relative;

  line-height: 0;

  z-index: 2;
  transform-origin: right;
  transform: rotateY(-65deg);

  background-color: var(--album-dark-color);

  &-inner {
    position: relative;

    height: 0;
    padding-bottom: 100%;

    img {
      position: absolute;

      top: 0;
      left: 0;

      width: 100%;
      height: 100%;
    }
  }
}

.cd-spine {
  position: relative;

  transform-origin: left;
  background-color: var(--album-color);

  z-index: 3;

  &-inner {
    position: absolute;

    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: column-reverse;
    justify-content: space-between;
    align-items: center;

    transform: rotate(180deg);
    min-width: 0;

    padding: 3px 0;

    font-size: 10px;
  }

  &-title,
  &-artists {
    writing-mode: vertical-lr;
    text-orientation: mixed;

    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    flex-basis: 50%;

    flex-shrink: 0;
  }

  &-artists {
    text-align: left;
  }

  &-title {
    text-align: right;
  }
}
</style>
