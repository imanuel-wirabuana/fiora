import { supabase } from "./supabase"
import type {
  Activity,
  ActivityContent,
  CreateActivityInput,
} from "../types/activity"

export const activityService = {
  async getActivities(relationshipId: number): Promise<Activity[]> {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("relationship_id", relationshipId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data as Activity[]) || []
  },

  async createActivity(input: CreateActivityInput): Promise<Activity> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error("You must be logged in to create an activity.")
    }

    const { data, error } = await supabase
      .from("activities")
      .insert({
        relationship_id: input.relationshipId,
        user_id: authData.user.id,
        type: input.type,
        content: input.content,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as Activity
  },

  async updateActivity(
    activityId: number,
    content: ActivityContent
  ): Promise<Activity> {
    const { data, error } = await supabase
      .from("activities")
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activityId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as Activity
  },

  async deleteActivity(activityId: number): Promise<void> {
    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", activityId)

    if (error) {
      throw new Error(error.message)
    }
  },

  subscribeToActivities(
    relationshipId: number,
    onChange: () => void
  ): () => void {
    const uniqueId = Math.random().toString(36).slice(2, 9)
    const channelName = `realtime-activities-${relationshipId}-${uniqueId}`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activities",
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

