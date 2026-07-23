<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, ChevronRight, X, Phone, Copy, CircleAlert } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'
import logoFull from '@/assets/logo-savin.svg'
import logoIcon from '@/assets/logo-savin-icon.svg'

const router = useRouter()
const auth = useAuthStore()

const login = ref('')
const password = ref('')
const show = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const helpOpen = ref(false)

async function handleSubmit() {
  error.value = null
  loading.value = true
  try {
    await auth.login(login.value, password.value)
    toast.success('Muvaffaqiyatli kirdingiz')
    router.replace({ name: 'dashboard' })
  } catch (err: any) {
    const msg = err?.response?.data?.detail || 'Xatolik yuz berdi'
    error.value = msg.includes('Invalid') || msg.includes('credentials') || err?.response?.status === 400
      ? "Parol xato! Yozuvingiz to'g'riligini diqqat bilan tekshiring."
      : msg
  } finally {
    loading.value = false
  }
}

function copyPhone() {
  navigator.clipboard.writeText('+998932425999')
  toast.success('Raqam nusxalandi')
}
</script>

<template>
  <div class="min-h-screen relative overflow-hidden bg-background">
    <!-- Green gradient on the right -->
    <div
      class="absolute inset-y-0 right-0 w-1/2 pointer-events-none"
      style="background: var(--gradient-green); opacity: 0.9"
    />
    <div
      class="absolute inset-y-0 right-0 w-1/2 pointer-events-none"
      style="background: linear-gradient(to left, transparent, oklch(0.16 0.005 260) 90%)"
    />

    <!-- Help button -->
    <div class="absolute top-6 right-6 z-20">
      <button
        @click="helpOpen = true"
        class="inline-flex items-center rounded-full bg-card/80 backdrop-blur border border-border hover:bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors"
      >
        Yordam <ChevronRight class="h-4 w-4 ml-1" />
      </button>
    </div>

    <!-- Error toast — inline -->
    <div
      v-if="error"
      class="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[min(420px,90vw)] animate-slide-in-top"
    >
      <div
        class="rounded-2xl bg-destructive/95 text-destructive-foreground px-4 py-3 flex items-start gap-3 shadow-lg"
        style="box-shadow: 0 0 40px oklch(0.65 0.24 25 / 0.4)"
      >
        <CircleAlert class="h-5 w-5 shrink-0 mt-0.5" />
        <p class="text-sm flex-1">{{ error }}</p>
        <button @click="error = null" class="shrink-0 opacity-80 hover:opacity-100">
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Login card -->
    <div class="relative z-10 min-h-screen flex items-center justify-center px-4 md:px-16 md:justify-start">
      <div
        class="w-full max-w-md rounded-3xl bg-card border border-border p-8 md:p-10 shadow-2xl"
        style="box-shadow: var(--shadow-card)"
      >
        <img :src="logoFull" alt="savin" class="h-9 w-auto mb-4" />
        <h1 class="text-3xl font-bold text-foreground leading-tight mb-8">
          Admin paneli
        </h1>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div class="space-y-2">
            <label for="login" class="text-muted-foreground text-sm block">Login</label>
            <input
              id="login"
              v-model="login"
              placeholder="Login"
              required
              class="w-full h-12 rounded-xl bg-input border border-border/50 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div class="space-y-2">
            <label for="password" class="text-muted-foreground text-sm block">Parol</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="show ? 'text' : 'password'"
                required
                minlength="6"
                class="w-full h-12 rounded-xl bg-input border border-border/50 pr-12 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                @click="show = !show"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <EyeOff v-if="show" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {{ loading ? 'Kutilmoqda...' : 'Kirish' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Help modal -->
    <div
      v-if="helpOpen"
      @click="helpOpen = false"
      class="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <div
        @click.stop
        class="relative w-full max-w-md rounded-3xl bg-popover border border-border p-8 text-center"
        style="box-shadow: var(--shadow-glow)"
      >
        <button
          @click="helpOpen = false"
          class="absolute top-4 right-4 w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent"
        >
          <X class="h-4 w-4" />
        </button>
        <div class="w-16 h-16 rounded-2xl bg-muted mx-auto mb-6 flex items-center justify-center">
          <img :src="logoIcon" alt="savin" class="h-9 w-9" />
        </div>
        <h2 class="text-2xl font-bold text-foreground mb-3">Qo'llab-quvvatlash</h2>
        <p class="text-sm text-muted-foreground mb-6">
          Agar sizga texnik yordam kerak bo'lsa, qo'llab-quvvatlash jamoamizga murojaat qiling.
        </p>
        <button
          @click="copyPhone"
          class="mx-auto flex items-center gap-3 px-5 py-3 rounded-full bg-muted hover:bg-accent transition"
        >
          <span class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Phone class="h-4 w-4 text-primary-foreground" />
          </span>
          <span class="text-foreground font-medium">+998 93 242 59 99</span>
          <Copy class="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  </div>
</template>
