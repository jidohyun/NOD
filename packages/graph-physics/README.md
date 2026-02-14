# graph-physics

`graph-physics` is a deterministic, headless force simulation package used by the dashboard graph renderer.

## Model Schema

### GraphNode

```ts
type NodeId = string;

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  vx: number;
  vy: number;
}

interface GraphNode {
  id: NodeId;
  pos: Position;
  vel: Velocity;
  radius: number;
  pinned: boolean;
  mass?: number;
  charge?: number;
  fx?: number;
  fy?: number;
}
```

### GraphEdge

```ts
interface GraphEdge {
  sourceId: NodeId;
  targetId: NodeId;
  restLength: number;
  strength: number;
  weight?: number;
}
```

## Force Equations (per tick)

The engine composes four primitives and then integrates velocity/position.

1. **Center force**
   - Pulls each node toward `options.center`.
   - Proportional to offset from center and `centerStrength`.

2. **Repel force**
   - Pairwise node-node repulsion.
   - Inverse-square behavior (`~ strength / distance^2`) with deterministic fallback at zero distance.

3. **Spring force**
   - Edge-based attraction.
   - Pulls endpoints toward `restLength` with `springStrength * edge.strength`.

4. **Collision force**
   - Pairwise separation when `distance < radiusA + radiusB + collisionPadding`.
   - Prevents visual overlap and jitter collapse.

After force accumulation:

- `vel = (vel + force * dt) * damping`
- `pos = pos + vel * dt`

Simulation heat (`alpha`) decays each tick and can be reheated by drag interactions.

## Drag Lifecycle

`GraphEngine` exposes drag hooks that match UI events:

- `onDragStart(nodeId, cursor)`
  - Pins dragged node to cursor (`fx/fy`), zeros velocity.
  - Reheats alpha (`DRAG_REHEAT_ALPHA`).
  - Captures local neighborhood for influence boosting.

- `onDragMove(nodeId, cursor)`
  - Updates pin target (`fx/fy`) continuously.
  - Holds alpha at drag temperature (`DRAG_HOLD_ALPHA`).

- `onDragEnd(nodeId)`
  - Unpins node (clears `fx/fy`).
  - Starts cool-down (`DRAG_RELEASE_ALPHA` -> `DRAG_COOL_DECAY`).

## K-hop Local Behavior

When a node is dragged, the engine computes its k-hop neighborhood:

- `getKHopNeighborhood(nodeId, edges, dragNeighborhoodHops)`
- Nodes and edges inside this neighborhood receive `localInfluenceBoost`.

This keeps nearby structure responsive while reducing global instability.

## Radial Mode

Radial constraint is optional:

- Controlled by `radialEnabled`.
- Uses `applyRadialForce(node, center, { targetRadius, strength })`.
- If enabled, it is composed with center/repel/spring/collision forces.

The default dashboard preset keeps radial mode disabled.

## Presets and Tuning Matrix

Presets live in `src/presets.ts` and are accessed through `createPreset()`:

- `obsidianLike`: balanced default interaction.
- `dragActive`: higher local responsiveness while dragging.
- `postDragCooldown`: smoother settle after release.

Each preset defines a full engine profile plus `tickStepsPerFrame`.

## Verification Workflow

Run from repository root:

```bash
cd packages/graph-physics && bun run test
cd apps/web && bun run test -- src/components/dashboard/__tests__/dashboard-layout.test.tsx
cd apps/web && bun run typecheck
```

Expected: tests and typecheck pass (existing unrelated warnings may still appear).
