<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown, Clock, Loader2, ChevronLeft } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import api from '@/api/client'
import { toast } from '@/composables/useToast'

const route = useRoute()

type AudienceType = 'all' | 'premium' | 'category' | 'individual'

const meta = ref({ all_count: 0, premium_count: 0, categories: [] as string[] })
const history = ref<any[]>([])

const audienceType = ref<AudienceType>('all')
const category = ref('')
const catOpen = ref(false)
const memberId = ref<string | null>(null)
const memberName = ref('')
const memberSearch = ref('')

const language = ref('uz')
const title = ref('')
const body = ref('')
const sendTime = ref('')
const timeOpen = ref(false)
const SEND_TIMES = ['Hozir', '19:00', '20:00', '21:00']

const sending = ref(false)
const selected = ref<any>(null)

// Validation highlight
const showErrors = ref(false)

async function loadMeta() {
  const { data } = await api.get('/notifications/meta/')
  meta.value = data
}
async function loadHistory() {
  const { data } = await api.get('/notifications/')
  history.value = data
}
onMounted(() => {
  loadMeta()
  loadHistory()
  // Pre-fill individual recipient when arriving from a user profile
  if (route.query.member) {
    audienceType.value = 'individual'
    memberId.value = String(route.query.member)
    memberName.value = String(route.query.name ?? '')
    memberSearch.value = memberName.value
  }
})

const audiences = [
  { key: 'all' as const, label: 'Barcha foydalanuvchilar' },
  { key: 'premium' as const, label: "Premium a'zolar" },
  { key: 'category' as const, label: 'Kategoriya bo\'yicha' },
  { key: 'individual' as const, label: 'Alohida odam' },
]

const recipientCount = computed(() => {
  if (audienceType.value === 'all') return meta.value.all_count
  if (audienceType.value === 'premium') return meta.value.premium_count
  if (audienceType.value === 'individual') return 1
  return meta.value.all_count
})

const formValid = computed(() => {
  if (!title.value || !body.value || !sendTime.value) return false
  if (audienceType.value === 'category' && !category.value) return false
  if (audienceType.value === 'individual' && !memberId.value) return false
  return true
})

async function send() {
  showErrors.value = true
  if (!formValid.value) {
    toast.error("Barcha majburiy maydonlarni to'ldiring")
    return
  }
  sending.value = true
  try {
    const payload: Record<string, any> = {
      title: title.value,
      body: body.value,
      audience_type: audienceType.value,
      language: language.value,
      send_time: sendTime.value,
    }
    if (audienceType.value === 'category') payload.category = category.value
    if (audienceType.value === 'individual') payload.member = memberId.value
    // Brief sending overlay to match the design's "Bildirishnoma yuborilmoqda..."
    await new Promise((r) => setTimeout(r, 900))
    await api.post('/notifications/', payload)
    toast.success('Muvaffaqiyatli yuborildi!')
    title.value = ''
    body.value = ''
    sendTime.value = ''
    showErrors.value = false
    loadHistory()
    loadMeta()
  } catch {
    toast.error('Yuborishda xatolik yuz berdi')
  } finally {
    sending.value = false
  }
}

async function resend(n: any) {
  title.value = n.title
  body.value = n.body
  audienceType.value = n.audience_type
  category.value = n.category || ''
  language.value = n.language
  sendTime.value = 'Hozir'
  selected.value = null
  toast.info('Forma to\'ldirildi — yuborish uchun tayyor')
}
async function remove(n: any) {
  try {
    await api.delete(`/notifications/${n.id}/`)
    selected.value = null
    toast.success("O'chirildi")
    loadHistory()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function invalid(field: 'title' | 'body' | 'time' | 'audience') {
  if (!showErrors.value) return false
  if (field === 'title') return !title.value
  if (field === 'body') return !body.value
  if (field === 'time') return !sendTime.value
  if (field === 'audience') {
    if (audienceType.value === 'category') return !category.value
    if (audienceType.value === 'individual') return !memberId.value
  }
  return false
}
</script>

<template>
  <div class="p-6 md:p-8 space-y-6">
    <PageHeader title="Bildirishnomalar" />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Composer -->
      <div class="rounded-2xl bg-card border border-border p-5 space-y-4 relative">
        <h3 class="text-foreground font-semibold text-lg">Yangi Bildirishnoma Yuborish</h3>

        <!-- Audience -->
        <div class="space-y-2">
          <button
            v-for="a in audiences"
            :key="a.key"
            @click="audienceType = a.key"
            :class="[
              'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-left transition-colors',
              audienceType === a.key ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/60 hover:bg-muted',
              invalid('audience') && audienceType === a.key ? 'ring-1 ring-destructive' : '',
            ]"
          >
            <span :class="['h-4 w-4 rounded-full border-2 flex items-center justify-center', audienceType === a.key ? 'border-primary' : 'border-muted-foreground/50']">
              <span v-if="audienceType === a.key" class="h-2 w-2 rounded-full bg-primary" />
            </span>
            <div class="flex-1">
              <div :class="audienceType === a.key ? 'text-primary' : 'text-foreground'">{{ a.label }}</div>
              <!-- Category dropdown inline -->
              <div v-if="a.key === 'category' && audienceType === 'category'" class="mt-2" @click.stop>
                <div class="relative">
                  <button
                    @click="catOpen = !catOpen"
                    class="w-full h-9 rounded-lg bg-muted border border-border px-3 text-sm text-foreground flex items-center justify-between"
                  >
                    <span>{{ category || 'Tanlang' }}</span>
                    <ChevronDown class="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div v-if="catOpen" class="absolute left-0 right-0 mt-1 max-h-44 overflow-y-auto rounded-lg bg-popover border border-border shadow-lg z-20 p-1">
                    <button
                      v-for="c in meta.categories"
                      :key="c"
                      @click="category = c; catOpen = false"
                      class="w-full text-left rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                    >
                      {{ c }}
                    </button>
                  </div>
                </div>
              </div>
              <!-- Individual search inline -->
              <div v-if="a.key === 'individual' && audienceType === 'individual'" class="mt-2" @click.stop>
                <input
                  v-model="memberSearch"
                  placeholder="Foydalanuvchi ismi..."
                  class="w-full h-9 rounded-lg bg-muted border border-border px-3 text-sm text-foreground"
                />
              </div>
            </div>
          </button>
        </div>

        <!-- Language -->
        <div>
          <label class="text-xs text-muted-foreground block mb-2">Til <span class="text-destructive">*</span></label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="l in [{ c: 'uz', n: 'O\'zbek' }, { c: 'ru', n: 'Русский' }, { c: 'en', n: 'English' }]"
              :key="l.c"
              @click="language = l.c"
              :class="[
                'rounded-lg py-2 text-sm transition-colors',
                language === l.c ? 'bg-primary/15 text-primary border border-primary/40' : 'bg-muted text-muted-foreground hover:bg-accent',
              ]"
            >
              {{ l.n }}
            </button>
          </div>
        </div>

        <!-- Title -->
        <div>
          <label class="text-xs text-muted-foreground block mb-2">Sarlavha <span class="text-destructive">*</span></label>
          <input
            v-model="title"
            placeholder="Yangi barber salon ochildi!"
            :class="['w-full h-10 rounded-xl bg-muted border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring', invalid('title') ? 'border-destructive' : 'border-transparent']"
          />
        </div>

        <!-- Body -->
        <div>
          <label class="text-xs text-muted-foreground block mb-2">Xabar matni</label>
          <textarea
            v-model="body"
            placeholder="Biznes faoliyati haqida qisqacha ma'lumot..."
            :class="['w-full min-h-24 rounded-xl bg-muted border p-4 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring', invalid('body') ? 'border-destructive' : 'border-transparent']"
          />
        </div>

        <!-- Send time -->
        <div>
          <label class="text-xs text-muted-foreground block mb-2">Yuborish vaqti <span class="text-destructive">*</span></label>
          <div class="relative">
            <button
              @click="timeOpen = !timeOpen"
              :class="['w-full h-10 rounded-xl bg-muted border px-4 text-sm text-foreground flex items-center justify-between', invalid('time') ? 'border-destructive' : 'border-transparent']"
            >
              <span class="flex items-center gap-2">
                <Clock class="h-4 w-4 text-muted-foreground" />
                {{ sendTime || 'Tanlang' }}
              </span>
              <ChevronDown class="h-4 w-4 text-muted-foreground" />
            </button>
            <div v-if="timeOpen" class="absolute left-0 right-0 bottom-full mb-1 rounded-xl bg-popover border border-border shadow-lg z-20 p-1">
              <button
                v-for="t in SEND_TIMES"
                :key="t"
                @click="sendTime = t; timeOpen = false"
                class="w-full flex items-center gap-2 text-left rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                <span :class="['h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center', sendTime === t ? 'border-primary' : 'border-muted-foreground/50']">
                  <span v-if="sendTime === t" class="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                {{ t }}
              </button>
            </div>
          </div>
        </div>

        <button
          @click="send"
          :disabled="sending"
          class="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
        >
          Yuborish
        </button>

        <!-- Sending overlay -->
        <div v-if="sending" class="absolute inset-0 rounded-2xl bg-card/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
          <Loader2 class="h-8 w-8 text-primary animate-spin" />
          <div class="text-center">
            <div class="text-foreground font-semibold">Bildirishnoma yuborilmoqda...</div>
            <div class="text-xs text-muted-foreground mt-1">{{ recipientCount.toLocaleString() }} ta foydalanuvchiga</div>
          </div>
        </div>
      </div>

      <!-- Sent list / detail -->
      <div class="rounded-2xl bg-card border border-border p-5">
        <!-- Detail view -->
        <template v-if="selected">
          <div class="flex items-center gap-2 mb-4">
            <button @click="selected = null" class="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent">
              <ChevronLeft class="h-4 w-4" />
            </button>
            <h3 class="text-foreground font-semibold text-lg">Bildirishnoma tafsiloti</h3>
          </div>
          <div class="space-y-3">
            <div class="rounded-xl bg-muted/40 p-3">
              <div class="text-xs text-muted-foreground">Sarlavha</div>
              <div class="text-foreground mt-0.5">{{ selected.title }}</div>
            </div>
            <div class="rounded-xl bg-muted/40 p-3">
              <div class="text-xs text-muted-foreground">Xabar matni</div>
              <div class="text-foreground mt-0.5 text-sm">{{ selected.body }}</div>
            </div>
            <div class="rounded-xl bg-muted/40 p-3 space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-muted-foreground">Auditoriya</span><span class="text-foreground">{{ selected.audience_label }}</span></div>
              <div class="flex justify-between"><span class="text-muted-foreground">Til</span><span class="text-foreground">{{ selected.language_label }}</span></div>
              <div class="flex justify-between"><span class="text-muted-foreground">Vaqt</span><span class="text-foreground">{{ selected.send_time }}</span></div>
              <div class="flex justify-between"><span class="text-muted-foreground">Yetkazilgan</span><span class="text-foreground">{{ Number(selected.delivered).toLocaleString() }}</span></div>
              <div class="flex justify-between"><span class="text-muted-foreground">Ochildi</span><span class="text-primary">{{ selected.open_rate }}</span></div>
            </div>
          </div>
          <div class="mt-4 space-y-2">
            <button @click="resend(selected)" class="w-full h-10 rounded-xl bg-muted hover:bg-accent text-sm font-medium text-foreground transition-colors">
              Yana shu bildirishnomani yuborish
            </button>
            <button @click="remove(selected)" class="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors">
              O'chirish
            </button>
          </div>
        </template>

        <!-- List view -->
        <template v-else>
          <h3 class="text-foreground font-semibold text-lg mb-4">Yuborilgan bildirishnomalar</h3>
          <div v-if="history.length" class="space-y-2">
            <button
              v-for="n in history"
              :key="n.id"
              @click="selected = n"
              class="w-full text-left rounded-xl bg-muted/40 hover:bg-muted p-4 transition-colors"
            >
              <div class="flex items-start justify-between gap-2">
                <span class="text-foreground font-medium">{{ n.title }}</span>
                <span class="text-xs text-muted-foreground shrink-0">{{ n.time_ago }}</span>
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ n.audience_label }} · {{ Number(n.delivered).toLocaleString() }} ta yuborildi
                <span v-if="n.open_rate"> · {{ n.open_rate }} ochildi</span>
              </div>
            </button>
          </div>
          <div v-else class="py-24 text-center">
            <p class="text-foreground font-semibold">Hali yuborilmagan</p>
            <p class="text-xs text-muted-foreground mt-1">Birinchi bildirishnomangizni yuboring</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
