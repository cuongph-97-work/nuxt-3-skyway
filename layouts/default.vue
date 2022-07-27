<template>
  <NConfigProvider inline-theme-disabled>
    <NSpace vertical>
      <NLayout has-sider>
        <NLayoutSider
          bordered
          collapse-mode="width"
          :collapsed-width="64"
          :width="240"
          :collapsed="collapsed"
          show-trigger
          @collapse="collapsed = true"
          @expand="collapsed = false"
        >
          <NMenu
            :collapsed="collapsed"
            :collapsed-width="64"
            :collapsed-icon-size="22"
            :options="menuOptions"
            :render-label="renderMenuLabel"
            :render-icon="renderMenuIcon"
            :expand-icon="expandIcon"
          />
        </NLayoutSider>
        <NLayout>
          <div style="width: 100%">
            <n-loading-bar-provider>
              <n-message-provider>
                <n-dialog-provider>
                  <slot />
                </n-dialog-provider>
              </n-message-provider>
            </n-loading-bar-provider>
          </div>
        </NLayout>
      </NLayout>
    </NSpace>
  </NConfigProvider>
</template>

<script lang="ts" setup>
import {
  NSpace,
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NSwitch,
  NLayout,
  NLayoutSider,
  NMenu
} from 'naive-ui'
import { h, ref, defineComponent } from 'vue'
import { NIcon } from 'naive-ui'
import {
  BookmarkOutline,
  CaretDownOutline,
  VideocamOutline,
  HomeOutline as HomeIcon
} from '@vicons/ionicons5'
import { RouterLink } from 'vue-router'
const collapsed = ref(false)
const menuOptions = [
  {
    key: 'home',
    label: 'Home',
    to: {
      name: 'index'
    },
    icon_text: HomeIcon
  },
  {
    key: 'p2p',
    label: '(1 đến 1, P2P)',
    to: {
      name: 'p2p_videochat'
    },
    icon_text: VideocamOutline
  }
  //   {
  //     label: '(nhiều người chơi, P2P)',
  //     to: {
  //       name: 'demo'
  //     },
  //     icon: () => VideocamOutline
  //   },
  //   {
  //     label: '(nhiều người chơi, SFU)',
  //     to: {
  //       name: 'demo'
  //     },
  //     icon: () => VideocamOutline
  //   },
  //   {
  //     label: '(một-nhiều, P2P)',
  //     to: {
  //       name: 'demo'
  //     },
  //     icon: () => VideocamOutline
  //   }
]
const renderMenuIcon = (option: any) => {
  return h(NIcon, null, { default: () => h(option.icon_text) })
}
const renderMenuLabel = (option: any) => {
  return h(
    RouterLink,
    {
      to: option.to
    },
    { default: () => option.label }
  )
}
const expandIcon = () => {
  return h(NIcon, null, { default: () => h(CaretDownOutline) })
}
</script>
