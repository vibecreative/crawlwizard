import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an admin using their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST USERS
    if (req.method === "GET" && action === "list") {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;

      const { data: profiles } = await adminClient.from("profiles").select("*");
      const { data: roles } = await adminClient.from("user_roles").select("*");

      const enrichedUsers = users.map((u: any) => {
        const profile = profiles?.find((p: any) => p.id === u.id);
        const userRoles = roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [];
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          full_name: profile?.full_name || null,
          company_name: profile?.company_name || null,
          is_active: profile?.is_active ?? true,
          plan: profile?.plan || "free",
          roles: userRoles,
        };
      });

      return new Response(JSON.stringify(enrichedUsers), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE USER
    if (req.method === "POST" && action === "update") {
      const body = await req.json();
      const { userId, is_active, plan, role } = body;

      if (!userId) throw new Error("userId is required");

      // Update profile
      if (is_active !== undefined || plan !== undefined) {
        const updates: any = {};
        if (is_active !== undefined) updates.is_active = is_active;
        if (plan !== undefined) updates.plan = plan;

        const { error } = await adminClient
          .from("profiles")
          .update(updates)
          .eq("id", userId);
        if (error) throw error;
      }

      // Update role
      if (role !== undefined) {
        // Remove existing roles
        await adminClient.from("user_roles").delete().eq("user_id", userId);
        // Add new role
        const { error } = await adminClient
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RESET AI CREDITS
    if (req.method === "POST" && action === "reset-credits") {
      const body = await req.json();
      const { userId } = body;

      if (!userId) throw new Error("userId is required");

      // Delete all credit usage for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { error } = await adminClient
        .from("ai_credit_usage")
        .delete()
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString());
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // VIEW USER DATA (impersonation - read only)
    if (req.method === "GET" && action === "view-user-data") {
      const targetUserId = url.searchParams.get("userId");
      if (!targetUserId) throw new Error("userId is required");

      const { data: projects, error: projError } = await adminClient
        .from("projects")
        .select("*")
        .eq("user_id", targetUserId)
        .order("updated_at", { ascending: false });
      if (projError) throw projError;

      let pages: any[] = [];
      if (projects && projects.length > 0) {
        const { data: pagesData, error: pagesError } = await adminClient
          .from("project_pages")
          .select("*")
          .in("project_id", projects.map((p: any) => p.id));
        if (pagesError) throw pagesError;
        pages = pagesData || [];
      }

      // Get target user profile
      const { data: profile } = await adminClient
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      return new Response(JSON.stringify({ projects, pages, profile }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE USER
    if (req.method === "POST" && action === "delete") {
      const body = await req.json();
      const { userId } = body;

      if (!userId) throw new Error("userId is required");
      if (userId === user.id) throw new Error("Cannot delete yourself");

      // Delete user via admin API (cascades profiles, roles, etc.)
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("admin-users error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
