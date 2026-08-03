import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createLocalTestClients, getLocalSupabaseTestConfig } from "../helpers/localSupabaseTestClient";

const config = getLocalSupabaseTestConfig();
const suite = config ? describe : describe.skip;

suite("local Anthiyur RLS boundary", () => {
  let clients;
  let owner;
  let other;
  let verifiedAdmin;
  const password = "Local-test-only-Password-42!";
  const rowIds = [];
  const email = (name) => `${name}-${crypto.randomUUID()}@local.test`;

  async function createUser(name) {
    const userEmail = email(name);
    const { data, error } = await clients.admin.auth.admin.createUser({ email: userEmail, password, email_confirm: true });
    if (error) throw error;
    const login = await clients.anon.auth.signInWithPassword({ email: userEmail, password });
    if (login.error) throw login.error;
    return { id: data.user.id, token: login.data.session.access_token };
  }

  beforeAll(async () => {
    clients = createLocalTestClients(config);
    owner = await createUser("owner");
    other = await createUser("other");
    verifiedAdmin = await createUser("admin");
    await clients.admin.from("admin_roles").insert({ user_id: verifiedAdmin.id });
    for (const [status, user] of [["Pending",owner],["Approved",other],["Rejected",other]]) {
      const payload={location_code:"L003",location_name:"Anthiyur",plot:"Plot A",treatment:"T1",observation_day:30,date_of_obs:"2026-08-02",fertigation_date:"2026-08-03",created_by:user.id,status,rejection_feedback:status==="Rejected"?"local test":null};
      const result=await clients.admin.from("anthiyur_field_entries").insert(payload).select("id").single();
      if(result.error) throw result.error;rowIds.push(result.data.id);
    }
  }, 30000);

  afterAll(async () => {
    if (!clients) return;
    if (rowIds.length) await clients.admin.from("anthiyur_field_entries").delete().in("id",rowIds);
    if (verifiedAdmin) await clients.admin.from("admin_roles").delete().eq("user_id",verifiedAdmin.id);
    for (const user of [owner,other,verifiedAdmin]) if(user) await clients.admin.auth.admin.deleteUser(user.id);
  }, 30000);

  it("anonymous RPC returns only Approved safe columns and raw operations fail", async () => {
    const rpc=await clients.anon.rpc("get_approved_anthiyur_dashboard_data");
    expect(rpc.error).toBeNull();expect(rpc.data.map((row)=>row.status)).toEqual(["Approved"]);
    for(const field of ["created_by","approved_by","rejection_feedback","custom_biometric"]) expect(rpc.data[0]).not.toHaveProperty(field);
    expect((await clients.anon.from("anthiyur_field_entries").select("id")).error).not.toBeNull();
    expect((await clients.anon.from("anthiyur_field_entries").insert({})).error).not.toBeNull();
    expect((await clients.anon.from("anthiyur_field_entries").update({status:"Approved"}).eq("id",rowIds[0])).error).not.toBeNull();
    expect((await clients.anon.from("anthiyur_field_entries").delete().eq("id",rowIds[0])).error).not.toBeNull();
  });

  it("recorders keep own-row access without reading or changing other rows", async () => {
    const recorder=clients.recorder(owner.token);
    const own=await recorder.from("anthiyur_field_entries").select("id,status");
    expect(own.error).toBeNull();expect(own.data.map((row)=>row.id)).toEqual([rowIds[0]]);
    expect((await recorder.rpc("get_approved_anthiyur_dashboard_data")).data.map((row)=>row.status)).toEqual(["Approved"]);
    const otherUpdate=await recorder.from("anthiyur_field_entries").update({status:"Approved"}).eq("id",rowIds[1]).select("id");
    expect(otherUpdate.data || []).toHaveLength(0);
  });

  it("verified admins retain raw read and approval update access", async () => {
    const adminClient=clients.recorder(verifiedAdmin.token);
    const read=await adminClient.from("anthiyur_field_entries").select("id,created_by,status").in("id",rowIds);
    expect(read.error).toBeNull();expect(read.data).toHaveLength(3);
    const update=await adminClient.from("anthiyur_field_entries").update({status:"Approved",approved_by:verifiedAdmin.id,approved_at:new Date().toISOString()}).eq("id",rowIds[0]).select("id,approved_by").single();
    expect(update.error).toBeNull();expect(update.data.approved_by).toBe(verifiedAdmin.id);
  });
});
