<template>
  <div class="space-y-2">
    <!-- Primary fields -->
    <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      <div>
        <span class="text-(--text-tertiary)">Merchant</span>
        <p class="font-medium truncate" :class="valueClass" :title="info.merchantName">
          {{ info.merchantName || '—' }}
        </p>
      </div>
      <div>
        <span class="text-(--text-tertiary)">Kota / City</span>
        <p class="font-medium truncate" :class="valueClass" :title="info.city">
          {{ info.city || '—' }}
        </p>
      </div>
      <div>
        <span class="text-(--text-tertiary)">Bank</span>
        <p class="font-medium truncate" :class="valueClass" :title="info.bank">
          {{ info.bank || '—' }}
        </p>
      </div>
      <div>
        <span class="text-(--text-tertiary)">MCC</span>
        <p class="font-medium truncate" :class="valueClass">
          {{ info.mcc ? `${info.mcc}${info.mccLabel ? ` · ${info.mccLabel}` : ''}` : '—' }}
        </p>
      </div>
    </div>

    <!-- Extra fields -->
    <Collapsible
      v-if="hasExtra"
      :open="showMore"
      variant="ghost"
      chevron-position="none"
      @update:open="showMore = $event"
    >
      <template #trigger>
        <Button variant="secondary" size="sm">
          <template #icon
            ><Icon
              :name="
                showMore
                  ? 'material-symbols:arrow-upward-alt'
                  : 'material-symbols:arrow-downward-alt'
              "
          /></template>

          {{ showMore ? 'Hide details' : 'See more details' }}
        </Button>
      </template>
      <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div v-if="info.merchantId" class="col-span-2">
          <span class="text-(--text-tertiary)">Merchant ID</span>
          <p class="font-mono truncate" :class="valueClass" :title="info.merchantId">
            {{ info.merchantId }}
          </p>
        </div>
        <div v-if="info.type">
          <span class="text-(--text-tertiary)">Tipe QRIS</span>
          <p class="font-medium" :class="valueClass">
            {{ info.type === 'static' ? 'Statis' : 'Dinamis' }}
          </p>
        </div>
        <div v-if="info.postalCode">
          <span class="text-(--text-tertiary)">Kode Pos</span>
          <p class="font-medium" :class="valueClass">{{ info.postalCode }}</p>
        </div>
        <div v-if="info.amount" class="col-span-2">
          <span class="text-(--text-tertiary)">Nominal</span>
          <p class="font-medium" :class="valueClass">
            Rp {{ Number(info.amount).toLocaleString('id-ID') }}
          </p>
        </div>
      </div>
    </Collapsible>
  </div>
</template>

<script setup lang="ts">
import type { QrisInfo } from '~/utils/parseQris'
import { Collapsible } from '~/components/ui/collapsible'
import { Button } from '~/components/ui/button'

const props = withDefaults(defineProps<{ info: QrisInfo; highlight?: boolean }>(), {
  highlight: false,
})

const showMore = ref(false)

const valueClass = computed(() =>
  props.highlight ? 'text-(--success-text)' : 'text-(--text-secondary)',
)

const hasExtra = computed(
  () => !!(props.info.merchantId || props.info.type || props.info.postalCode || props.info.amount),
)
</script>
