import axios from "axios"
import { defineStore } from "pinia"
import { computed, ref } from "vue"

export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('token'))
    const maimaiCode = ref("")
    const timeLimit = ref("")
    const simplifiedCode = computed(() => maimaiCode.value.slice(8, 28).match(/.{1,4}/g)?.join(' '))
    const axiosInstance = axios.create({
        baseURL: import.meta.env.VITE_URL,
        timeout: 3000,
        headers: { 'Authorization': `Bearer ${token}` },
    });

    const isSignedIn = ref(false)
    const userProfile = ref<UserProfile | null>(null)

    async function login(username: string, password: string) {
        try {
            const data = await axiosInstance.post('/users/token', new URLSearchParams({
                username,
                password
            }))
            localStorage.setItem('token', data.data.access_token)
            token.value = data.data.access_token
            await refreshUser()
            return true
        } catch (error) {
            // TODO: Show error message
            return false
        }
    }

    async function refreshUser() {
        try {
            const response = (await axiosInstance.get('/users/profile'))
            userProfile.value = response.data
            isSignedIn.value = true
        } catch (error) {
            isSignedIn.value = false
        }
    }

    async function getImages(): Promise<Record<string, ImagePublic[]>> {
        const response = await axiosInstance.get('/images')
        const data = response.data
        const result = data.reduce((acc: any, obj: any) => {
            if (!acc[obj.kind]) {
                acc[obj.kind] = [];
            }

            acc[obj.kind].push({
                id: obj.id,
                name: obj.name,
                uploaded_by: obj.uploaded_by
            });

            return acc;
        }, {});
        return result
    }

    async function patchPreferences(preferences: UserPreferencePublic) {
        const response = await axiosInstance.patch('/users/preference', preferences)
        if (response.status === 200) {
            userProfile.value = response.data
        }
        return response.status === 200
    }

    return { axiosInstance, maimaiCode, timeLimit, simplifiedCode, userProfile, isSignedIn, refreshUser, getImages, patchPreferences, login }
})