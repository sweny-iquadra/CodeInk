import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Folder, 
  Tag, 
  Users, 
  Share, 
  MessageSquare, 
  History, 
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GitBranch,
  Clock,
  Filter,
  X,
  ChevronRight,
  UserPlus,
  Mail,
  Check,
  AlertCircle
} from "lucide-react";
import type { 
  Category, 
  Tag as TagType, 
  GeneratedLayout, 
  Team,
  SharedLayout,
  LayoutComment,
  CreateCategoryRequest,
  CreateTagRequest,
  CreateTeamRequest
} from "@shared/schema";

// Team invitation types
interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

interface TeamInvitation {
  id: number;
  teamId: number;
  invitedUserId: number;
  invitedBy: number;
  role: string;
  status: string;
  layoutId?: number;
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

// Team Invitation Interface Component
function TeamInvitationInterface({ team, layouts }: { team: Team; layouts: GeneratedLayout[] }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [selectedLayout, setSelectedLayout] = useState<GeneratedLayout | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<GeneratedLayout | null>(null);
  const [message, setMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users for selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"]
  });

  // Fetch layout versions when layout is selected
  const { data: layoutVersions = [] } = useQuery<GeneratedLayout[]>({
    queryKey: [`/api/layouts/${selectedLayout?.id}/versions`],
    enabled: !!selectedLayout?.id
  });

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Get categories and tags for selected layout
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"]
  });
  
  const { data: tags = [] } = useQuery<TagType[]>({
    queryKey: ["/api/tags"]
  });

  const inviteUserMutation = useMutation({
    mutationFn: (inviteData: any) => apiRequest("POST", "/api/teams/invite", inviteData),
    onSuccess: () => {
      toast({ title: "Invitation sent successfully!" });
      setSelectedUser(null);
      setSelectedRole("member");
      setSelectedLayout(null);
      setSelectedVersion(null);
      setMessage("");
      setUserSearch("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send invitation", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleSendInvitation = () => {
    if (!selectedUser) {
      toast({ 
        title: "Please select a user", 
        variant: "destructive" 
      });
      return;
    }

    const inviteData = {
      teamId: team.id,
      invitedUserId: selectedUser.id,
      role: selectedRole,
      layoutId: selectedVersion?.id || selectedLayout?.id,
      message: message.trim() || undefined
    };

    inviteUserMutation.mutate(inviteData);
  };

  return (
    <div className="space-y-6">
      {/* User Selection */}
      <div className="space-y-3">
        <Label>Select User to Invite</Label>
        <Input
          placeholder="Search users by username or email..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />
        <div className="max-h-40 overflow-y-auto border rounded-md">
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
          ) : (
            filteredUsers.map((user: User) => (
              <div
                key={user.id}
                className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedUser?.id === user.id ? "bg-muted" : ""
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  {selectedUser?.id === user.id && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <Label>Assign Role</Label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin - Full control</SelectItem>
            <SelectItem value="editor">Editor - Can create/edit layouts</SelectItem>
            <SelectItem value="viewer">Viewer - View layouts and comment</SelectItem>
            <SelectItem value="member">Member - Basic collaboration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Layout Selection */}
      <div className="space-y-2">
        <Label>Assign Specific Layout (Optional)</Label>
        <Select 
          value={selectedLayout?.id?.toString() || ""} 
          onValueChange={(value) => {
            const layout = layouts.find(l => l.id.toString() === value);
            setSelectedLayout(layout || null);
            setSelectedVersion(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select layout (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No specific layout</SelectItem>
            {layouts.map((layout: GeneratedLayout) => (
              <SelectItem key={layout.id} value={layout.id.toString()}>
                {layout.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Version Selection */}
      {selectedLayout && layoutVersions.length > 0 && (
        <div className="space-y-2">
          <Label>Select Version</Label>
          <Select 
            value={selectedVersion?.id?.toString() || ""} 
            onValueChange={(value) => {
              const version = layoutVersions.find(v => v.id.toString() === value);
              setSelectedVersion(version || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={selectedLayout.id.toString()}>
                Original - {selectedLayout.title}
              </SelectItem>
              {layoutVersions.map((version: GeneratedLayout) => (
                <SelectItem key={version.id} value={version.id.toString()}>
                  v{version.versionNumber} - {version.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Auto-bind Categories and Tags Info */}
      {(selectedVersion || selectedLayout) && (
        <div className="p-3 bg-muted/30 rounded-md">
          <div className="text-sm font-medium mb-2">Layout Details:</div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Title: {(selectedVersion || selectedLayout)?.title}</div>
            <div>Description: {(selectedVersion || selectedLayout)?.description || "No description"}</div>
            {(selectedVersion || selectedLayout)?.categoryId && (
              <div>Category: {categories.find(c => c.id === (selectedVersion || selectedLayout)?.categoryId)?.name || "Unknown"}</div>
            )}
            <div>Categories and tags will be automatically available to the team member.</div>
          </div>
        </div>
      )}

      {/* Message */}
      <div className="space-y-2">
        <Label>Message (Optional)</Label>
        <Textarea
          placeholder="Add a personal message for the invitation..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
      </div>

      {/* Send Invitation Button */}
      <Button 
        onClick={handleSendInvitation}
        disabled={!selectedUser || inviteUserMutation.isPending}
        className="w-full"
      >
        {inviteUserMutation.isPending ? "Sending Invitation..." : "Send Invitation"}
      </Button>
    </div>
  );
}

// Team Invitations Component
function TeamInvitations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's pending invitations
  const { data: invitations = [] } = useQuery<TeamInvitation[]>({
    queryKey: ["/api/invitations"]
  });

  const respondToInvitationMutation = useMutation({
    mutationFn: ({ invitationId, status }: { invitationId: number; status: string }) =>
      apiRequest("POST", `/api/invitations/${invitationId}/respond`, { status }),
    onSuccess: (_, variables) => {
      const action = variables.status === "accepted" ? "accepted" : "declined";
      toast({ title: `Invitation ${action} successfully!` });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to respond to invitation", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleResponse = (invitationId: number, status: string) => {
    respondToInvitationMutation.mutate({ invitationId, status });
  };

  if (invitations.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Mail className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation: TeamInvitation) => (
        <Card key={invitation.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-medium text-sm">Team Invitation</div>
                <Badge variant="outline" className="text-xs">{invitation.role}</Badge>
              </div>
              {invitation.message && (
                <p className="text-sm text-muted-foreground mb-2">"{invitation.message}"</p>
              )}
              <div className="text-xs text-muted-foreground">
                Invited {new Date(invitation.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResponse(invitation.id, "accepted")}
                disabled={respondToInvitationMutation.isPending}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResponse(invitation.id, "rejected")}
                disabled={respondToInvitationMutation.isPending}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface ProjectManagementProps {
  onSelectLayout: (layout: GeneratedLayout) => void;
  currentLayout?: GeneratedLayout;
}

export function ProjectManagement({ onSelectLayout, currentLayout }: ProjectManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for dialogs and forms
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [tagDialog, setTagDialog] = useState(false);
  const [teamDialog, setTeamDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedLayout, setSelectedLayout] = useState<number | null>(null);
  const [viewingCategoryId, setViewingCategoryId] = useState<number | null>(null);
  const [addTagDialog, setAddTagDialog] = useState(false);

  // Form states
  const [categoryForm, setCategoryForm] = useState<CreateCategoryRequest>({
    name: "",
    color: "#8b5cf6",
    description: ""
  });
  const [tagForm, setTagForm] = useState<CreateTagRequest>({
    name: "",
    color: "#6b7280",
    description: ""
  });
  const [teamForm, setTeamForm] = useState<CreateTeamRequest>({
    name: "",
    description: ""
  });

  // Queries
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"]
  });

  const { data: tags = [] } = useQuery<TagType[]>({
    queryKey: ["/api/tags"]
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    retry: 3,
    staleTime: 5000
  });

  const { data: sharedLayouts = [] } = useQuery<SharedLayout[]>({
    queryKey: ["/api/layouts/shared"]
  });

  // Add layouts query for version control
  const { data: layouts = [] } = useQuery<GeneratedLayout[]>({
    queryKey: ["/api/layouts"]
  });

  // Get base layouts for dropdown - exclude titles that start with "Improved:"
  const uniqueLayouts = layouts.filter((layout: GeneratedLayout) => 
    !layout.parentLayoutId && !layout.title.startsWith("Improved:")
  );

  // Query for layouts by category
  const { data: categoryLayouts = [] } = useQuery<GeneratedLayout[]>({
    queryKey: [`/api/categories/${viewingCategoryId}/layouts`],
    enabled: !!viewingCategoryId
  });

  // Calculate layout counts per category
  const getCategoryLayoutCount = (categoryId: number) => {
    return layouts.filter((layout: GeneratedLayout) => layout.categoryId === categoryId).length;
  };

  // Query for current layout tags - ensure it's always an array
  const { data: currentLayoutTags = [] } = useQuery<TagType[]>({
    queryKey: [`/api/layouts/${currentLayout?.id}/tags`],
    enabled: !!(currentLayout?.id && currentLayout.id > 0 && !isNaN(currentLayout.id))
  });

  // Ensure currentLayoutTags is always an array for safety
  const safeCurrentLayoutTags = Array.isArray(currentLayoutTags) ? currentLayoutTags : [];

  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/layouts/search", searchQuery, selectedCategory, selectedTags, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (selectedCategory) params.append("categoryId", selectedCategory.toString());
      if (selectedTags.length > 0) params.append("tagIds", selectedTags.join(","));
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      
      return apiRequest("GET", `/api/layouts/search?${params.toString()}`);
    },
    enabled: !!(searchQuery || selectedCategory || selectedTags.length > 0)
  });



  const { data: currentLayoutComments = [] } = useQuery({
    queryKey: ["/api/layouts", currentLayout?.id, "comments"],
    queryFn: () => apiRequest("GET", `/api/layouts/${currentLayout?.id}/comments`),
    enabled: !!(currentLayout?.id && currentLayout.id > 0)
  });

  const { data: layoutVersions = [] } = useQuery({
    queryKey: ["/api/layouts", selectedLayout, "versions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/layouts/${selectedLayout}/versions`);
      return await response.json();
    },
    enabled: !!selectedLayout
  });

  const { data: versionHistory = [] } = useQuery({
    queryKey: ["/api/layouts", selectedLayout, "history"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/layouts/${selectedLayout}/history`);
      return await response.json();
    },
    enabled: !!selectedLayout
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: CreateCategoryRequest) => 
      apiRequest("POST", "/api/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryDialog(false);
      setCategoryForm({ name: "", color: "#8b5cf6", description: "" });
      toast({ title: "Category created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating category", description: error.message, variant: "destructive" });
    }
  });

  const createTagMutation = useMutation({
    mutationFn: (data: CreateTagRequest) => 
      apiRequest("POST", "/api/tags", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      setTagDialog(false);
      setTagForm({ name: "", color: "#6b7280" });
      toast({ title: "Tag created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating tag", description: error.message, variant: "destructive" });
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      console.log("Deleting tag with ID:", tagId);
      try {
        const response = await apiRequest("DELETE", `/api/tags/${tagId}`);
        return { success: true, tagId };
      } catch (error: any) {
        // Check if it's a 404 (already deleted) vs other errors
        if (error.message && error.message.includes("Tag not found")) {
          return { success: false, alreadyDeleted: true, tagId };
        }
        throw error;
      }
    },
    onSuccess: (result) => {
      // Update cache to remove the tag
      queryClient.setQueryData(["/api/tags"], (oldTags: TagType[] = []) => {
        return oldTags.filter(tag => tag.id !== result.tagId);
      });
      
      if (result.success) {
        toast({ title: "Tag deleted successfully" });
      } else if (result.alreadyDeleted) {
        toast({ 
          title: "Tag removed", 
          description: "This tag was already deleted."
        });
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
    },
    onError: (error: any) => {
      console.error("Tag deletion error:", error);
      toast({ 
        title: "Error deleting tag", 
        description: error.message || "Failed to delete tag",
        variant: "destructive" 
      });
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: CreateTeamRequest) => 
      apiRequest("POST", "/api/teams", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setTeamDialog(false);
      setTeamForm({ name: "", description: "" });
      toast({ title: "Team created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating team", description: error.message, variant: "destructive" });
    }
  });

  // Tag assignment mutations
  const addTagMutation = useMutation({
    mutationFn: ({ layoutId, tagId }: { layoutId: number, tagId: number }) => {
      console.log("Adding tag:", { layoutId, tagId });
      return apiRequest("POST", `/api/layouts/${layoutId}/tags/${tagId}`);
    },
    onSuccess: (data) => {
      console.log("Tag added successfully:", data);
      // Invalidate both the specific layout tags and the general layouts query
      queryClient.invalidateQueries({ queryKey: [`/api/layouts/${currentLayout?.id}/tags`] });
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      setAddTagDialog(false);
      toast({ title: "Tag added successfully" });
    },
    onError: (error) => {
      console.error("Failed to add tag:", error);
      toast({ title: "Failed to add tag", variant: "destructive" });
    }
  });

  const removeTagMutation = useMutation({
    mutationFn: ({ layoutId, tagId }: { layoutId: number, tagId: number }) => {
      console.log("Removing tag:", { layoutId, tagId });
      return apiRequest("DELETE", `/api/layouts/${layoutId}/tags/${tagId}`);
    },
    onSuccess: (data) => {
      console.log("Tag removed successfully:", data);
      // Invalidate both the specific layout tags and the general layouts query
      queryClient.invalidateQueries({ queryKey: [`/api/layouts/${currentLayout?.id}/tags`] });
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      toast({ title: "Tag removed successfully" });
    },
    onError: (error) => {
      console.error("Failed to remove tag:", error);
      toast({ title: "Failed to remove tag", variant: "destructive" });
    }
  });



  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Project Management
        </h2>
      </div>

      <Tabs defaultValue="organize" className="flex-1">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="organize">Organize</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="collaborate">Teams</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="organize" className="p-4 space-y-4">
          {/* Categories Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Categories
              </CardTitle>
              <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">Name</Label>
                      <Input
                        id="category-name"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., E-commerce, Landing Pages"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-color">Color</Label>
                      <Input
                        id="category-color"
                        type="color"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-description">Description</Label>
                      <Textarea
                        id="category-description"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                    <Button 
                      onClick={() => createCategoryMutation.mutate(categoryForm)}
                      disabled={!categoryForm.name || createCategoryMutation.isPending}
                      className="w-full"
                    >
                      Create Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category: Category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-accent"
                    onClick={() => setViewingCategoryId(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryLayoutCount(category.id)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Layouts View */}
          {viewingCategoryId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Layouts in {categories.find(c => c.id === viewingCategoryId)?.name}
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setViewingCategoryId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryLayouts.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No layouts in this category yet
                    </div>
                  ) : (
                    Array.isArray(categoryLayouts) && categoryLayouts.map((layout: GeneratedLayout) => (
                      <div
                        key={layout.id}
                        className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-accent"
                        onClick={() => onSelectLayout(layout)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium truncate">{layout.title}</h4>
                            {layout.isPublic ? (
                              <Eye className="w-3 h-3 text-green-500" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-gray-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {layout.description}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                              {new Date(layout.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {/* Placeholder for tag count - will be updated with real count */}
                                0 tags
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </CardTitle>
              <Dialog open={tagDialog} onOpenChange={setTagDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Tag</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tag-name">Name</Label>
                      <Input
                        id="tag-name"
                        value={tagForm.name}
                        onChange={(e) => setTagForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., responsive, dark-mode"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tag-color">Color</Label>
                      <Input
                        id="tag-color"
                        type="color"
                        value={tagForm.color}
                        onChange={(e) => setTagForm(prev => ({ ...prev, color: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tag-description">Description</Label>
                      <Textarea
                        id="tag-description"
                        value={tagForm.description}
                        onChange={(e) => setTagForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                    <Button 
                      onClick={() => createTagMutation.mutate(tagForm)}
                      disabled={!tagForm.name || createTagMutation.isPending}
                      className="w-full"
                    >
                      Create Tag
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag: TagType) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs cursor-pointer group flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20"
                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                    onClick={(e) => {
                      // Prevent the click from bubbling up when clicking the X button
                      if ((e.target as HTMLElement).closest('.delete-tag-btn')) {
                        return;
                      }
                      setSelectedTags(prev => 
                        prev.includes(tag.id) 
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  >
                    <span>{tag.name}</span>
                    <button
                      className="delete-tag-btn ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-800 rounded-full p-0.5"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Attempting to delete tag:", { id: tag.id, name: tag.name });
                        if (window.confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
                          deleteTagMutation.mutate(tag.id);
                        }
                      }}
                      title={`Delete tag "${tag.name}"`}
                    >
                      <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Layout Info */}
          {currentLayout && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Layout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-medium">{currentLayout.title}</h3>
                  <p className="text-sm text-muted-foreground">{currentLayout.description}</p>
                </div>
                
                {/* Layout Tags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Tags</Label>
                    <Dialog open={addTagDialog} onOpenChange={setAddTagDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Tag
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md" aria-describedby="add-tag-description">
                        <DialogHeader>
                          <DialogTitle className="text-sm">Add Tag to Layout</DialogTitle>
                        </DialogHeader>
                        <p id="add-tag-description" className="text-sm text-muted-foreground">
                          Select a tag to assign to this layout.
                        </p>
                        <div className="space-y-4">
                          <Label className="text-xs">Available Tags</Label>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {tags.filter(tag => !safeCurrentLayoutTags.some(current => current.id === tag.id)).map((tag: TagType) => (
                              <div
                                key={tag.id}
                                className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-accent"
                                onClick={(e) => {
                                  e.preventDefault();
                                  console.log("Clicked tag:", tag, "Current layout:", currentLayout);
                                  if (currentLayout?.id && currentLayout.id > 0 && !isNaN(currentLayout.id) && tag.id) {
                                    addTagMutation.mutate({ layoutId: currentLayout.id, tagId: tag.id });
                                  } else {
                                    console.error("Invalid layout or tag data:", { 
                                      layoutId: currentLayout?.id, 
                                      tagId: tag.id,
                                      isValidLayout: !!(currentLayout?.id && currentLayout.id > 0 && !isNaN(currentLayout.id))
                                    });
                                    toast({ 
                                      title: "Invalid Layout", 
                                      description: "Please select a valid layout first", 
                                      variant: "destructive" 
                                    });
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: tag.color }}
                                  />
                                  <span className="text-sm">{tag.name}</span>
                                </div>
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              </div>
                            ))}
                            {tags.filter(tag => !safeCurrentLayoutTags.some(current => current.id === tag.id)).length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                All tags have been assigned to this layout
                              </p>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {safeCurrentLayoutTags.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No tags assigned</p>
                    ) : (
                      safeCurrentLayoutTags.map((tag: TagType) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-xs flex items-center gap-1 pr-1"
                          style={{ backgroundColor: tag.color + "20", color: tag.color }}
                        >
                          {tag.name}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-3 w-3 p-0 hover:bg-transparent"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log("Removing tag:", tag, "from layout:", currentLayout?.id);
                              if (currentLayout?.id && currentLayout.id > 0 && !isNaN(currentLayout.id) && tag.id) {
                                removeTagMutation.mutate({ layoutId: currentLayout.id, tagId: tag.id });
                              } else {
                                toast({ 
                                  title: "Invalid Layout", 
                                  description: "Cannot remove tag from invalid layout", 
                                  variant: "destructive" 
                                });
                              }
                            }}
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Comments Count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  {currentLayoutComments.length} comments
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="versions" className="p-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Choose Layout</Label>
              <Select 
                value={selectedLayout?.toString() || ""} 
                onValueChange={(value) => setSelectedLayout(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose layout..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueLayouts.map((layout: GeneratedLayout) => (
                    <SelectItem key={layout.id} value={layout.id.toString()}>
                      {layout.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLayout && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Version History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.isArray(versionHistory) && versionHistory.length > 0 ? (
                      versionHistory.map((version: GeneratedLayout) => (
                        <div
                          key={version.id}
                          className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => onSelectLayout(version)}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm flex items-center gap-2">
                              <GitBranch className="h-3 w-3" />
                              {version.versionNumber || 'Original'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {version.changesDescription || version.description}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(version.createdAt).toLocaleDateString()} at {new Date(version.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {version.inputMethod}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No versions available. Versions are automatically created when layouts are modified.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
            )}

            {!selectedLayout && (
              <Card>
                <CardContent className="p-6 text-center">
                  <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select a layout above to manage its versions
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="collaborate" className="p-4 space-y-4">
          {/* Teams Management Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Teams
              </CardTitle>
              <Dialog open={teamDialog} onOpenChange={setTeamDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                    Create Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="team-name">Team Name</Label>
                      <Input
                        id="team-name"
                        value={teamForm.name}
                        onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Design Team, Marketing Team"
                      />
                    </div>
                    <div>
                      <Label htmlFor="team-description">Description (Optional)</Label>
                      <Textarea
                        id="team-description"
                        value={teamForm.description}
                        onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the team's purpose and goals"
                      />
                    </div>
                    <Button 
                      onClick={() => createTeamMutation.mutate(teamForm)}
                      disabled={!teamForm.name || createTeamMutation.isPending}
                      className="w-full"
                    >
                      {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teams.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No teams yet. Create your first team to start collaborating!</p>
                  </div>
                ) : (
                  teams.map((team: Team) => (
                    <Card key={team.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm">{team.name}</h3>
                            <Badge variant="outline" className="text-xs">Admin</Badge>
                          </div>
                          {team.description && (
                            <p className="text-xs text-muted-foreground mb-2">{team.description}</p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Created {new Date(team.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            0 members
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Invite Team Members - {team.name}</DialogTitle>
                              </DialogHeader>
                              <TeamInvitationInterface team={team} layouts={layouts} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Invitations Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TeamInvitations />
            </CardContent>
          </Card>

          {/* Shared Layouts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Share className="h-4 w-4" />
                Shared with Me
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sharedLayouts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Share className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No shared layouts yet</p>
                  </div>
                ) : (
                  sharedLayouts.map((share: SharedLayout) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 rounded border bg-muted/30"
                    >
                      <div>
                        <div className="text-sm font-medium">Layout #{share.layoutId}</div>
                        <div className="text-xs text-muted-foreground">
                          Shared {new Date(share.sharedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {share.permissions}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Layouts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={selectedCategory?.toString() || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? null : parseInt(value))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="space-y-1">
                      <Label htmlFor="date-from" className="text-xs text-muted-foreground font-medium">From Date</Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:bg-background focus:text-foreground transition-colors"
                        placeholder="Select start date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="date-to" className="text-xs text-muted-foreground font-medium">To Date</Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full h-10 px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:bg-background focus:text-foreground transition-colors"
                        placeholder="Select end date"
                        min={dateFrom || undefined}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="mt-2 max-h-24 overflow-y-auto border rounded-md p-2 bg-muted/30">
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: TagType) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={selectedTags.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTags([...selectedTags, tag.id]);
                              } else {
                                setSelectedTags(selectedTags.filter(id => id !== tag.id));
                              }
                            }}
                          />
                          <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer">
                            <Badge 
                              style={{ backgroundColor: tag.color }} 
                              className="text-white text-xs"
                            >
                              {tag.name}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags available. Create tags in the Organization tab.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                  setSelectedTags([]);
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>

            {/* Search Results */}
            <div className="space-y-2">
              {searchResults.map((layout: GeneratedLayout) => (
                <Card
                  key={layout.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => onSelectLayout(layout)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-sm">{layout.title}</h3>
                        <p className="text-xs text-muted-foreground">{layout.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {layout.isPublic ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(layout.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}