import { supabase } from "./supabase"
import type {
  CreateRelationshipInput,
  JoinRelationshipInput,
  Relationship,
  RelationshipMember,
  RelationshipMemberContent,
  UserRelationshipData,
} from "../types/relationship"

export const relationshipService = {
  async getUserRelationship(userId: string): Promise<UserRelationshipData | null> {
    // 1. Find membership for the current user
    const { data: memberData, error: memberError } = await supabase
      .from("relationship_members")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (memberError) {
      throw new Error(memberError.message)
    }

    if (!memberData) {
      return null
    }

    const currentMember = memberData as RelationshipMember

    // 2. Fetch the relationship details
    const { data: relData, error: relError } = await supabase
      .from("relationships")
      .select("*")
      .eq("id", currentMember.relationship_id)
      .single()

    if (relError) {
      throw new Error(relError.message)
    }

    const relationship = relData as Relationship

    // 3. Fetch all members in this relationship (to find partner)
    const { data: allMembers, error: allMembersError } = await supabase
      .from("relationship_members")
      .select("*")
      .eq("relationship_id", relationship.id)

    if (allMembersError) {
      throw new Error(allMembersError.message)
    }

    const members = (allMembers as RelationshipMember[]) || []
    const partnerMember = members.find((m) => m.user_id !== userId) || null

    return {
      relationship,
      currentMember,
      partnerMember,
      members,
    }
  },

  async createRelationship(input: CreateRelationshipInput): Promise<UserRelationshipData> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error("You must be logged in to create a relationship.")
    }

    const userId = authData.user.id
    const inviteCode = input.inviteCode || String(Math.floor(10000 + Math.random() * 90000))

    // 1. Insert relationship
    const { data: relData, error: relError } = await supabase
      .from("relationships")
      .insert({
        invite_code: inviteCode,
        content: {
          anniversary: input.anniversary || null,
          moods: input.moods || [],
          nudges: input.nudges || [],
        },
      })
      .select()
      .single()

    if (relError) {
      throw new Error(relError.message)
    }

    const relationship = relData as Relationship

    // 2. Insert current member
    const { data: memberData, error: memberError } = await supabase
      .from("relationship_members")
      .insert({
        relationship_id: relationship.id,
        user_id: userId,
        content: {
          gender: input.gender,
          name: input.name,
          avatar: input.avatar,
        },
      })
      .select()
      .single()

    if (memberError) {
      throw new Error(memberError.message)
    }

    const currentMember = memberData as RelationshipMember

    return {
      relationship,
      currentMember,
      partnerMember: null,
      members: [currentMember],
    }
  },

  async joinRelationship(input: JoinRelationshipInput): Promise<UserRelationshipData> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error("You must be logged in to join a relationship.")
    }

    const userId = authData.user.id

    // 1. Find relationship by invite code
    const { data: relData, error: relError } = await supabase
      .from("relationships")
      .select("*")
      .eq("invite_code", input.inviteCode.trim())
      .maybeSingle()

    if (relError) {
      throw new Error(relError.message)
    }

    if (!relData) {
      throw new Error("Invalid invite code. No relationship found.")
    }

    const relationship = relData as Relationship

    // 2. Check if already a member or if already 2 members
    const { data: existingMembers, error: countError } = await supabase
      .from("relationship_members")
      .select("*")
      .eq("relationship_id", relationship.id)

    if (countError) {
      throw new Error(countError.message)
    }

    const membersList = (existingMembers as RelationshipMember[]) || []
    const alreadyMember = membersList.find((m) => m.user_id === userId)

    if (alreadyMember) {
      return {
        relationship,
        currentMember: alreadyMember,
        partnerMember: membersList.find((m) => m.user_id !== userId) || null,
        members: membersList,
      }
    }

    if (membersList.length >= 2) {
      throw new Error("This relationship already has 2 members.")
    }

    // 3. Insert member
    const { data: newMemberData, error: joinError } = await supabase
      .from("relationship_members")
      .insert({
        relationship_id: relationship.id,
        user_id: userId,
        content: {
          gender: input.gender,
          name: input.name,
          avatar: input.avatar,
        },
      })
      .select()
      .single()

    if (joinError) {
      throw new Error(joinError.message)
    }

    // 4. Once partner successfully joins, set invite_code to null
    await supabase
      .from("relationships")
      .update({ invite_code: null })
      .eq("id", relationship.id)

    const currentMember = newMemberData as RelationshipMember
    const partnerMember = membersList.find((m) => m.user_id !== userId) || null

    return {
      relationship: {
        ...relationship,
        invite_code: null,
      },
      currentMember,
      partnerMember,
      members: [...membersList, currentMember],
    }
  },

  async regenerateInviteCode(relationshipId: number): Promise<string> {
    const newCode = String(Math.floor(10000 + Math.random() * 90000))
    const { error } = await supabase
      .from("relationships")
      .update({ invite_code: newCode })
      .eq("id", relationshipId)

    if (error) {
      throw new Error(error.message)
    }

    return newCode
  },

  async updateRelationshipContent(
    relationshipId: number,
    content: Partial<Relationship["content"]>
  ): Promise<Relationship> {
    // 1. Get current content
    const { data: currentData, error: fetchError } = await supabase
      .from("relationships")
      .select("content")
      .eq("id", relationshipId)
      .single()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    const mergedContent = {
      ...(currentData?.content || {}),
      ...content,
    }

    const { data: updatedData, error: updateError } = await supabase
      .from("relationships")
      .update({
        content: mergedContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", relationshipId)
      .select()
      .single()

    if (updateError) {
      throw new Error(updateError.message)
    }

    return updatedData as Relationship
  },

  async updateMemberContent(
    memberId: number,
    content: Partial<RelationshipMemberContent>
  ): Promise<RelationshipMember> {
    // 1. Get current member content
    const { data: currentData, error: fetchError } = await supabase
      .from("relationship_members")
      .select("content")
      .eq("id", memberId)
      .single()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    const mergedContent = {
      ...(currentData?.content || {}),
      ...content,
    }

    const { data: updatedData, error: updateError } = await supabase
      .from("relationship_members")
      .update({
        content: mergedContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId)
      .select()
      .single()

    if (updateError) {
      throw new Error(updateError.message)
    }

    return updatedData as RelationshipMember
  },

  subscribeToRelationshipChanges(
    params: { userId: string; relationshipId?: number },
    onChange: () => void
  ): () => void {
    // Generate a unique channel topic per subscription instance to prevent collisions
    const uniqueId = Math.random().toString(36).slice(2, 9)
    const channelName = `realtime-relationship-${params.userId}-${params.relationshipId || "pending"}-${uniqueId}`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "relationship_members",
        },
        () => {
          onChange()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "relationships",
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
