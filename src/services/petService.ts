import { supabase } from "./supabase"
import type { CreatePetInput, Pet, UpdatePetInput } from "@/types/pet"

export const petService = {
  async getPetByRelationship(relationshipId: number): Promise<Pet | null> {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("relationship_id", relationshipId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return (data as Pet | null) ?? null
  },

  async createPet(input: CreatePetInput): Promise<Pet> {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("pets")
      .insert({
        relationship_id: input.relationshipId,
        name: input.name,
        content: input.content,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as Pet
  },

  async updatePet(input: UpdatePetInput): Promise<Pet> {
    const now = new Date().toISOString()
    const payload: { name?: string; content: UpdatePetInput["content"]; updated_at: string } = {
      content: input.content,
      updated_at: now,
    }
    if (input.name !== undefined) {
      payload.name = input.name
    }

    const { data, error } = await supabase
      .from("pets")
      .update(payload)
      .eq("id", input.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as Pet
  },

  subscribeToPetChanges(
    relationshipId: number,
    onChange: () => void
  ): () => void {
    const channel = supabase
      .channel(`pets-${relationshipId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pets",
          filter: `relationship_id=eq.${relationshipId}`,
        },
        () => {
          onChange()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
