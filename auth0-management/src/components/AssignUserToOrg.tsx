import { List, ActionPanel, Action, showToast, Toast, Icon, Image, useNavigation } from "@raycast/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { searchUsers, addMembersToOrganization, getOrganizationMembers } from "../utils/auth0-client";
import { Organization, Tenant, User } from "../utils/types";

interface AssignUserToOrgProps {
  tenant: Tenant;
  organization: Organization;
}

function getErrorMessage(err: unknown): string {
  if (err != null && typeof err === "object" && "body" in err) {
    const body = (err as { body?: { message?: string } }).body;
    if (body?.message) return body.message;
  }
  return err instanceof Error ? err.message : "Unknown error";
}

export default function AssignUserToOrg({ tenant, organization }: AssignUserToOrgProps) {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const membersReady = useRef(false);
  const { pop } = useNavigation();

  // Fetch existing org members first, then do the initial user search
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        const members = await getOrganizationMembers(tenant, organization.id);
        if (!cancelled) {
          setMemberIds(new Set(members.map((m) => m.user_id)));
        }
      } catch {
        // If we can't fetch members, continue — show all users
      }
      membersReady.current = true;

      // Do the initial empty search after members are loaded
      try {
        const results = await searchUsers(tenant, "");
        if (!cancelled) setUsers(results);
      } catch (err) {
        if (!cancelled) {
          showToast({ style: Toast.Style.Failure, title: "Search Failed", message: getErrorMessage(err) });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [tenant, organization.id]);

  const doSearch = useCallback(
    async (term: string) => {
      setIsLoading(true);
      try {
        const results = await searchUsers(tenant, term);
        setUsers(results);
      } catch (err) {
        showToast({ style: Toast.Style.Failure, title: "Search Failed", message: getErrorMessage(err) });
      } finally {
        setIsLoading(false);
      }
    },
    [tenant],
  );

  // Debounced search — skip the initial empty search (handled by init above)
  useEffect(() => {
    if (!membersReady.current) return;
    const timer = setTimeout(() => {
      doSearch(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, doSearch]);

  const unassignedUsers = users.filter((u) => !memberIds.has(u.user_id));

  const handleAssign = useCallback(
    async (user: User) => {
      try {
        await showToast({ style: Toast.Style.Animated, title: "Assigning user…" });
        await addMembersToOrganization(tenant, organization.id, [user.user_id]);
        await showToast({
          style: Toast.Style.Success,
          title: "User Assigned",
          message: `${user.email} added to ${organization.display_name || organization.name}`,
        });
        pop();
      } catch (err) {
        showToast({ style: Toast.Style.Failure, title: "Assignment Failed", message: getErrorMessage(err) });
      }
    },
    [tenant, organization, pop],
  );

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search users to assign…"
      navigationTitle={`Assign User to ${organization.display_name || organization.name}`}
    >
      {unassignedUsers.length === 0 && !isLoading && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No Users Found"
          description={
            searchText.trim().length > 0 && searchText.trim().length < 3
              ? "Type at least 3 characters to search"
              : searchText
                ? "Try a different search term or all matching users are already assigned"
                : "Start typing to search users"
          }
        />
      )}
      {unassignedUsers.map((user) => (
        <List.Item
          key={user.user_id}
          icon={user.picture ? { source: user.picture, mask: Image.Mask.Circle } : Icon.Person}
          title={user.email}
          subtitle={user.name}
          actions={
            <ActionPanel>
              <Action title="Assign to Organization" icon={Icon.AddPerson} onAction={() => handleAssign(user)} />
              <Action.CopyToClipboard title="Copy User ID" content={user.user_id} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
