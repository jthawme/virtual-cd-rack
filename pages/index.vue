<template>
  <div class="content">
    <header>
      <h1>CD RACK</h1>
    </header>

    <div
      ref="canvas"
      v-resize="onResize"
      class="pool"
      :style="
        `--tile-size: ${tileInfo.size};  --highlight-size: ${highlightSize}`
      "
      @click="onActiveClick"
    >
      <CDDisplay
        :width="width"
        :cds="filteredAlbums"
        @index="onIndex"
        @info="onTileInfo"
      />

      <div
        v-if="highlightedAlbum"
        class="highlight"
        :class="{
          right: highlightPosition.right,
          bottom: highlightPosition.bottom
        }"
        :style="
          `--x:${highlightPosition.x}; --y:${highlightPosition.y};--size:${highlightPosition.size};`
        "
      >
        <CDHighlight
          :key="highlightedAlbum.id"
          v-bind="highlightedAlbum"
          class="highlight-inner"
        />
      </div>
    </div>

    <aside>
      <div class="left">
        <span v-if="currentAlbum" class="title">{{
          todayActive === currentAlbum.id ? "Today" : "Highlight"
        }}</span>
        <div
          v-if="currentAlbum"
          :key="currentAlbum.id"
          class="current"
          :style="`--size: 30`"
        >
          <CDHighlight v-bind="currentAlbum" />
        </div>
      </div>

      <div class="right">
        <div class="info">
          <p>
            This CD rack is digital, but it perfectly mirrors one that is not
            digital: my CD rack.
          </p>
          <p>
            Please, take a look and be amazed.
          </p>
        </div>

        <div class="search">
          <span class="title">Search</span>
          <input
            v-model="currentFilter"
            type="search"
            placeholder="Artist, album"
          />
        </div>

        <div class="group">
          <span class="title">Random selection</span>
          <button @click="onRandom">Random</button>
          <!-- <button @click="highlight = null">Clear</button> -->
        </div>
      </div>
    </aside>
  </div>
</template>

<script>
import seedrandom from "seedrandom";
import { search } from "fast-fuzzy";

import CDDisplay from "~/components/CDDisplay.vue";
import { randomArr } from "~/assets/js/utils";
import CDHighlight from "~/components/CDHighlight.vue";

const dateStr = () => {
  const d = new Date();
  return [d.getFullYear(), d.getMonth(), d.getDate()].join("-");
};

export default {
  components: { CDDisplay, CDHighlight },
  async fetch() {
    const { albums } = await this.$store.getters
      .load()
      .then(resp => resp.json());

    this.$store.commit("setAlbums", albums);
  },
  data() {
    return {
      width: -1,

      currentFilter: "",
      highlight: null,
      active: null,
      todayActive: null,

      highlightSize: 5,

      tileInfo: {
        size: -1,
        perRow: 0
      }
    };
  },
  computed: {
    currentAlbum() {
      return this.active && this.albums.find(item => item.id === this.active);
    },
    albums() {
      return this.$store.state.albums;
    },
    filteredAlbums() {
      if (this.currentFilter) {
        const albums = search(this.currentFilter, this.albums, {
          keySelector: obj => obj.title,
          threshold: 0.8
        });

        const artists = search(this.currentFilter, this.albums, {
          keySelector: obj => {
            return obj.artists.join(" ");
          },
          threshold: 0.9
        });

        return [...new Set([...albums, ...artists])];
      }

      return this.albums;
    },

    highlightPosition() {
      if (typeof this.highlight !== "number") {
        return null;
      }

      const row = Math.floor(this.highlight / this.tileInfo.perRow);
      const col = this.highlight % this.tileInfo.perRow;

      return {
        x: this.tileInfo.size * col,
        y: this.tileInfo.size * row,
        size: this.tileInfo.size,
        right: col + this.highlightSize > this.tileInfo.perRow,
        bottom:
          row + (this.highlightSize + 2) >
            Math.ceil(this.filteredAlbums.length / this.tileInfo.perRow) &&
          row > this.highlightSize
      };
    },

    highlightedAlbum() {
      return this.filteredAlbums[this.highlight] || null;
    }
  },
  mounted() {
    this.width = this.$refs.canvas.clientWidth;

    const rng = seedrandom(dateStr());
    this.highlight = Math.floor(this.albums.length * rng());
    this.onActiveClick();
    this.todayActive = this.active;
  },
  methods: {
    onResize({ width }) {
      this.width = width;
    },
    onRandom() {
      const mbid = randomArr(this.filteredAlbums).id;

      this.highlight = this.filteredAlbums.findIndex(item => item.id === mbid);

      this.onActiveClick();
    },
    onIndex(index) {
      this.highlight =
        index >= 0 && index < this.filteredAlbums.length ? index : null;
    },
    onTileInfo(info) {
      this.tileInfo = { ...info };
    },
    onActiveClick() {
      if (!this.highlight) {
        return;
      }

      this.active = this.filteredAlbums[this.highlight].id;
    }
  }
};
</script>

<style lang="scss" scoped>
.content {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  padding: 1rem;
}

header {
  h1 {
    color: #111;

    font-size: calc(24vw - 1rem);
    text-align: center;

    line-height: 1;
    margin: -0.6em 0 0;

    opacity: 0.25;
  }
}

.pool {
  position: relative;

  // min-height: calc((var(--tile-size) * (var(--highlight-size) + 2)) * 1px);
}

.search {
  position: relative;

  z-index: 1;

  background-color: var(--color-bg);

  input {
    display: block;

    -webkit-appearance: none;

    padding: 10px;
    margin: 0;

    border: none;

    width: 100%;

    font-size: inherit;

    outline: none;

    background-color: rgba(0, 0, 0, 0.25);

    color: white;

    &::placeholder {
      color: #e5e5e5;
    }
  }
}

aside {
  display: grid;

  grid-template-columns: 1fr;

  gap: 1rem;

  color: #111;

  @include large-mobile {
    grid-template-columns: 1fr 1fr;

    align-items: center;
  }

  .left {
    @include large-mobile {
      display: flex;

      flex-direction: column;

      align-items: center;
      justify-content: center;

      padding: 3rem 0;

      .current {
        width: 100%;
      }
    }
  }

  .info {
    p {
      font-weight: 500;
    }
  }

  .title {
    font-weight: 700;
    font-size: 10px;

    margin: 1rem 0;
  }
}

.group {
  margin: 1rem 0;

  .title {
    margin-left: 0;
    margin-right: 0;
  }

  button {
    display: block;

    border: none;

    background-color: rgba(0, 0, 0, 0.25);
    color: inherit;

    cursor: pointer;

    padding: 5px 10px;
    margin: 10px 0;
  }
}

.highlight {
  position: absolute;

  left: calc(var(--x, 0) * 1px);
  top: calc(var(--y, 0) * 1px);

  width: calc(var(--size, 0) * 1px);
  height: calc(var(--size, 0) * 1px);

  z-index: 10;

  pointer-events: none;

  &-inner {
    position: absolute;

    top: 0;
    left: 0;

    width: calc(((var(--size, 0) * var(--highlight-size, 5)) * 1px));
  }

  &.right {
    .highlight-inner {
      right: 0;
      left: auto;
    }
  }

  &.bottom {
    .highlight-inner {
      bottom: 0;
      top: auto;
    }
  }
}

.current {
  max-width: 200px;
}
</style>
