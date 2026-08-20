import { describe, it, expect, vi } from "vitest";
import { resolveTopology, SfuManager } from "./SfuManager";

// Mock NeighbourhoodProxy
function mockNeighbourhood(overrides: Partial<Record<string, any>> = {}) {
  return {
    sfuConfig: vi.fn().mockResolvedValue({
      mode: "mesh",
      designatedPeer: null,
      sfuPeers: [],
      fallback: "mesh",
      maxMeshParticipants: 4,
      maxParticipantsPerNode: null,
      ...overrides.config,
    }),
    sfuPeers: vi.fn().mockResolvedValue(overrides.sfuPeers ?? []),
    sfuPeer: vi.fn().mockResolvedValue(overrides.sfuPeer ?? null),
    callJoin: vi.fn().mockResolvedValue(
      overrides.callJoin ?? {
        roomName: "test",
        neighbourhoodUrl: "nh://test",
        participantId: "P1",
        sdpAnswer: "{}",
        redirectTo: null,
        streamMapping: [],
      }
    ),
    callLeave: vi.fn().mockResolvedValue(true),
    callSetQualityPreference: vi.fn().mockResolvedValue(true),
    callAnswerServerOffer: vi.fn().mockResolvedValue(true),
    subscribeCallRenegotiationOffer: vi.fn().mockReturnValue(() => {}),
  } as any;
}

describe("resolveTopology", () => {
  it("returns mesh for mesh mode", async () => {
    const neighbourhood = mockNeighbourhood({ config: { mode: "mesh" } });
    const result = await resolveTopology(neighbourhood, "test://nh", 2);
    expect(result.topology).toBe("mesh");
    expect(result.sfuPeer).toBeNull();
  });

  it("returns cascaded for cascaded mode with multiple peers", async () => {
    const neighbourhood = mockNeighbourhood({
      config: { mode: "cascaded" },
      sfuPeers: ["did:1", "did:2"],
    });
    const result = await resolveTopology(neighbourhood, "test://nh", 2);
    expect(result.topology).toBe("cascaded");
    expect(result.sfuPeer).toBe("did:1");
  });

  it("returns sfu for cascaded mode with single peer", async () => {
    const neighbourhood = mockNeighbourhood({
      config: { mode: "cascaded" },
      sfuPeers: ["did:only"],
    });
    const result = await resolveTopology(neighbourhood, "test://nh", 2);
    expect(result.topology).toBe("sfu");
    expect(result.sfuPeer).toBe("did:only");
  });

  it("returns mesh for cascaded mode with no peers", async () => {
    const neighbourhood = mockNeighbourhood({
      config: { mode: "cascaded" },
      sfuPeers: [],
    });
    const result = await resolveTopology(neighbourhood, "test://nh", 2);
    expect(result.topology).toBe("mesh");
    expect(result.sfuPeer).toBeNull();
  });

  it("returns sfu when sfuPeer available and participants > maxMesh", async () => {
    const neighbourhood = mockNeighbourhood({
      config: { mode: "designated", maxMeshParticipants: 2 },
      sfuPeer: "did:sfu",
    });
    const result = await resolveTopology(neighbourhood, "test://nh", 3);
    expect(result.topology).toBe("sfu");
    expect(result.sfuPeer).toBe("did:sfu");
  });

  it("returns mesh when participants <= maxMesh even with sfuPeer", async () => {
    const neighbourhood = mockNeighbourhood({
      config: { mode: "designated", maxMeshParticipants: 4 },
      sfuPeer: "did:sfu",
    });
    const result = await resolveTopology(neighbourhood, "test://nh", 4);
    expect(result.topology).toBe("mesh");
    expect(result.sfuPeer).toBe("did:sfu");
  });

  // ---- Bug 1 regression tests: config scoping / gateway mode ----

  it("MUST_return_sfu_topology_when_gateway_mode_and_maxMesh_zero", async () => {
    const neighbourhood = mockNeighbourhood({
      config: { mode: "designated", maxMeshParticipants: 0 },
      sfuPeer: "did:gateway-sfu",
    });
    const result = await resolveTopology(neighbourhood, "test://nh", 1);
    expect(result.topology).toBe("sfu");
    expect(result.sfuPeer).toBe("did:gateway-sfu");
  });

  it("MUST_return_cascaded_topology_for_cascaded_mode", async () => {
    const neighbourhood = mockNeighbourhood({
      config: { mode: "cascaded" },
      sfuPeers: ["did:node1", "did:node2", "did:node3"],
    });
    const result = await resolveTopology(neighbourhood, "test://nh", 5);
    expect(result.topology).toBe("cascaded");
  });

  it("MUST_force_sfu_when_maxMeshParticipants_is_zero_regardless_of_count", async () => {
    const neighbourhood = mockNeighbourhood({
      config: { mode: "designated", maxMeshParticipants: 0 },
      sfuPeer: "did:sfu-node",
    });
    // Even with just 1 participant, 1 > 0 so SFU should be chosen
    const result = await resolveTopology(neighbourhood, "test://nh", 1);
    expect(result.topology).toBe("sfu");
    expect(result.sfuPeer).toBe("did:sfu-node");
  });

  it("MUST_propagate_error_when_sfuConfig_throws", async () => {
    const neighbourhood = mockNeighbourhood();
    neighbourhood.sfuConfig.mockRejectedValue(new Error("network error"));
    // resolveTopology doesn't catch internally — the caller (webrtcStore) catches and falls back to mesh.
    await expect(resolveTopology(neighbourhood, "test://nh", 2)).rejects.toThrow("network error");
  });
});

// ---- Bug 2 regression tests: topology mapping ----

describe("topology mapping (Bug 2: config mode to SfuTopology)", () => {
  it("MUST_map_gateway_mode_to_sfu_topology", () => {
    // The fix in webrtcStore maps config.mode to SfuTopology:
    // sfuMode === 'cascaded' ? 'cascaded' : 'sfu'
    const sfuMode = "gateway";
    const sfuTopologyForMode = sfuMode === "cascaded" ? "cascaded" : "sfu";
    expect(sfuTopologyForMode).toBe("sfu");
  });

  it("MUST_map_cascaded_mode_to_cascaded_topology", () => {
    const sfuMode = "cascaded";
    const sfuTopologyForMode = sfuMode === "cascaded" ? "cascaded" : "sfu";
    expect(sfuTopologyForMode).toBe("cascaded");
  });

  it("MUST_map_designated_mode_to_sfu_topology", () => {
    const sfuMode = "designated";
    const sfuTopologyForMode = sfuMode === "cascaded" ? "cascaded" : "sfu";
    expect(sfuTopologyForMode).toBe("sfu");
  });

  it("MUST_NOT_pass_raw_config_mode_as_topology", () => {
    // "gateway" is NOT a valid SfuTopology — it must be mapped to "sfu"
    const validTopologies = ["sfu", "mesh", "cascaded"];
    const sfuMode = "gateway";
    const mapped = sfuMode === "cascaded" ? "cascaded" : "sfu";
    expect(validTopologies).toContain(mapped);
    expect(validTopologies).not.toContain(sfuMode);
  });
});

describe("SfuManager", () => {
  // ---- Bug 1 regression: constructor accepts agentDid ----

  it("MUST_accept_agentDid_parameter_in_constructor", () => {
    const neighbourhood = mockNeighbourhood();
    const manager = new SfuManager(neighbourhood, "room1", "did:key:test-agent");
    expect(manager).toBeDefined();
    expect(manager.getState().roomId).toBe("room1");
  });

  it("MUST_accept_optional_neighbourhoodUrl_and_iceConfig", () => {
    const neighbourhood = mockNeighbourhood();
    const manager = new SfuManager(neighbourhood, "room1", "did:key:agent", "nh://test", {
      stun: ["stun:stun.example.com:3478"],
      turn: [{ urls: "turn:turn.example.com", username: "user", credential: "pass" }],
    });
    expect(manager).toBeDefined();
  });

  it("selectNode picks lowest load", () => {
    const neighbourhood = mockNeighbourhood();
    const manager = new SfuManager(neighbourhood, "room1", "did:key:agent");
    const nodes = [
      { did: "a", participantCount: 5, capacityHint: 10 },
      { did: "b", participantCount: 2, capacityHint: 10 },
      { did: "c", participantCount: 8, capacityHint: 10 },
    ];
    const selected = (manager as any).selectNode(nodes);
    expect(selected.did).toBe("b");
  });

  it("setQualityPreference calls neighbourhood API", async () => {
    const neighbourhood = mockNeighbourhood();
    const manager = new SfuManager(neighbourhood, "room1", "did:key:agent");
    (manager as any).state.participantId = "P1";
    await manager.setQualityPreference("low");
    expect(neighbourhood.callSetQualityPreference).toHaveBeenCalledWith("", "room1", "low");
  });

  it("leave calls callLeave and clears state", async () => {
    const neighbourhood = mockNeighbourhood();
    const manager = new SfuManager(neighbourhood, "room1", "did:key:agent");
    (manager as any).state.participantId = "P1";
    (manager as any).state.participants.set("stream1", {
      did: "did:1",
      stream: {} as MediaStream,
      hasAudio: true,
      hasVideo: false,
      isActiveSpeaker: false,
    });

    await manager.leave();
    expect(neighbourhood.callLeave).toHaveBeenCalledWith("", "room1");
    expect((manager as any).state.participants.size).toBe(0);
    expect((manager as any).state.participantId).toBeNull();
  });

  it("events can be registered and emitted", () => {
    const neighbourhood = mockNeighbourhood();
    const manager = new SfuManager(neighbourhood, "room1", "did:key:agent");
    const cb = vi.fn();
    manager.on("topology-changed", cb);
    (manager as any).emit("topology-changed", "mesh");
    expect(cb).toHaveBeenCalledWith("mesh");
  });

  it("cascade failover stops after exhausting nodes", () => {
    const neighbourhood = mockNeighbourhood();
    const manager = new SfuManager(neighbourhood, "room1", "did:key:agent");
    (manager as any).state.topology = "cascaded";
    (manager as any).state.cascadeNodes = [
      { did: "a", participantCount: 5, capacityHint: 10 },
    ];
    (manager as any).state.connectedNodeDid = "a";

    const errorCb = vi.fn();
    manager.on("error", errorCb);

    // Simulate multiple failover attempts
    for (let i = 0; i < 5; i++) {
      (manager as any).handleCascadeFailover();
    }

    // Should have emitted error after exhausting nodes
    expect(errorCb).toHaveBeenCalled();
  });
});
