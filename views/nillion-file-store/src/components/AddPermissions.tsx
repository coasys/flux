import { UserPermission } from "./FileView";

import styles from "./FileView.module.css";

interface AddPermissionsProps {
  profiles: Map<string, any>;
  otherAgents: string[];
  nillionUsers: any[];
  permissions: UserPermission[];
  setPermissions: (permissions: UserPermission[]) => void;
}

export default function AddPermissions({
  profiles,
  otherAgents,
  nillionUsers,
  permissions,
  setPermissions,
}: AddPermissionsProps) {
  const toggleUserPermission = (newPermission: UserPermission) => {
    // Check if user already has permission and op
    const existingPermission = permissions.find(
      (permission) =>
        permission.op === newPermission.op &&
        permission.did === newPermission.did
    );
    if (existingPermission) {
      setPermissions(
        permissions.filter(
          (permission) =>
            permission.op !== newPermission.op ||
            permission.did !== newPermission.did
        )
      );
    } else {
      setPermissions([...permissions, newPermission]);
    }
  };

  console.log({ permissions, otherAgents, nillionUsers });

  return (
    <>
      <j-box>
        <j-flex j="center" a="center" wrap gap="500" direction="column">
          <j-text>Add user access</j-text>
          {otherAgents.map((did, index) => {
            const nillionAgentId = nillionUsers.find(
              (user) => user.author == did
            );

            if (!nillionAgentId) return null;

            function hasPermission(op: string) {
              return permissions.some(
                (permission) => permission.op === op && permission.did === did
              );
            }

            return (
              <j-flex j="center" a="center" wrap gap="500" direction="row">
                <j-flex a="center" gap="200">
                  <j-avatar
                    size="xs"
                    src={profiles.get(did)?.profileImage}
                    hash={did}
                  ></j-avatar>
                  <j-text nomargin size="400" key={index}>
                    {profiles.get(did)?.username || "Anonymous"}
                  </j-text>
                </j-flex>
                <j-flex a="center" gap="200" direction="column">
                  <j-text>Write</j-text>
                  <j-button
                    variant={hasPermission("write") ? "primary" : ""}
                    onClick={() =>
                      toggleUserPermission({
                        op: "write",
                        nillionAgentId: nillionAgentId.userId,
                        did: did,
                      })
                    }
                  >
                    <j-icon name="plus" />
                  </j-button>
                </j-flex>
                <j-flex a="center" gap="200" direction="column">
                  <j-text>Read</j-text>
                  <j-button
                    variant={hasPermission("read") ? "primary" : ""}
                    onClick={() =>
                      toggleUserPermission({
                        op: "read",
                        nillionAgentId: nillionAgentId.userId,
                        did: did,
                      })
                    }
                  >
                    <j-icon name="eye" />
                  </j-button>
                </j-flex>
                <j-flex a="center" gap="200" direction="column">
                  <j-text>Delete</j-text>
                  <j-button
                    variant={hasPermission("delete") ? "primary" : ""}
                    onClick={() =>
                      toggleUserPermission({
                        op: "delete",
                        nillionAgentId: nillionAgentId.userId,
                        did: did,
                      })
                    }
                  >
                    <j-icon name="x" />
                  </j-button>
                </j-flex>
                <j-flex a="center" gap="200" direction="column">
                  <j-text>Update</j-text>
                  <j-button
                    variant={hasPermission("update") ? "primary" : ""}
                    onClick={() =>
                      toggleUserPermission({
                        op: "update",
                        nillionAgentId: nillionAgentId.userId,
                        did: did,
                      })
                    }
                  >
                    <j-icon name="arrow-clockwise" />
                  </j-button>
                </j-flex>
              </j-flex>
            );
          })}
        </j-flex>
      </j-box>
    </>
  );
}
