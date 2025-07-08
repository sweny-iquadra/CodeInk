import { useState, useEffect, useMemo } from "react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  User,
  Shield,
  Crown,
  Layout,
  Info,
  Send,
  Clock,
  Filter,
  X,
  ChevronRight,
  UserPlus,
  Mail,
  Check,
  AlertCircle,
  RotateCcw
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
function TeamInvitationInterface({ team, onClose }: { team: Team; onClose: () => void }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [selectedLayout, setSelectedLayout] = useState<GeneratedLayout | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<GeneratedLayout | null>(null);

  const [message, setMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userComboOpen, setUserComboOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users for selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"]
  });

  // Query for all public layouts (not just user's own layouts)
  const { data: publicLayouts = [] } = useQuery<GeneratedLayout[]>({
    queryKey: ["/api/public-layouts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/public-layouts?limit=100");
      return await response.json();
    }
  });

  // Fetch layout versions when layout is selected
  const { data: layoutVersions = [] } = useQuery<GeneratedLayout[]>({
    queryKey: [`/api/layouts/${selectedLayout?.id}/versions`],
    enabled: !!selectedLayout?.id
  });

  // State for user search autocomplete
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Search users with autocomplete
  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ["/api/users/search", userSearchQuery],
    queryFn: async () => {
      if (!userSearchQuery.trim()) return [];
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(userSearchQuery)}`);
      return response.json();
    },
    enabled: !!userSearchQuery.trim() && userSearchQuery.length > 1,
    staleTime: 500, // Cache for 500ms
  });

  // Filter users based on search - use search results if searching, otherwise show all users
  const filteredUsers = useMemo(() => {
    if (userSearchQuery.trim() && searchResults.length >= 0) {
      return searchResults;
    }
    return users.filter(user => 
      user && user.username && user.email
    );
  }, [users, userSearchQuery, searchResults]);

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
      onClose(); // Auto-close the modal
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

    if (!selectedLayout) {
      toast({ 
        title: "Please select a layout", 
        variant: "destructive" 
      });
      return;
    }

    const inviteData = {
      teamId: team.id,
      invitedUserId: selectedUser.id,
      role: selectedRole,
      layoutId: selectedLayout.id,
      message: message.trim() || undefined
    };

    inviteUserMutation.mutate(inviteData);
  };

  return (
    <div className="space-y-8">
      {/* User Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Select User to Invite *</Label>
        </div>
        <Popover open={userComboOpen} onOpenChange={setUserComboOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={userComboOpen}
              className="w-full justify-between h-12 bg-background hover:bg-accent/50 border-2 border-dashed border-muted-foreground/20 hover:border-primary/40"
            >
              {selectedUser ? (
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-1.5 rounded-full">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{selectedUser.username}</div>
                    <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span>Search and select user...</span>
                </div>
              )}
              <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Type to search users..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              {userSearchQuery.length > 0 && userSearchQuery.length < 2 && (
                <div className="text-sm text-muted-foreground p-3 text-center">
                  Type at least 2 characters to search
                </div>
              )}
              {userSearchQuery.length >= 2 && filteredUsers.length === 0 && (
                <div className="text-sm text-muted-foreground p-3 text-center">No users found</div>
              )}
              <div className="max-h-60 overflow-y-auto mt-2">
                {filteredUsers.map((user: User) => user && (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedUser(user);
                      setUserComboOpen(false);
                      setUserSearchQuery("");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-1.5 rounded-full">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.username || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{user.email || 'No email'}</div>
                      </div>
                    </div>
                    {selectedUser?.id === user.id && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Role Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Assign Role</Label>
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="h-12 border-2 border-dashed border-muted-foreground/20 hover:border-primary/40">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin" className="p-3">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 dark:bg-red-900/20 p-1.5 rounded">
                  <Crown className="h-3 w-3 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="font-medium text-sm">Admin</div>
                  <div className="text-xs text-muted-foreground">Full control over team and layouts</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="editor" className="p-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-1.5 rounded">
                  <Edit className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-sm">Editor</div>
                  <div className="text-xs text-muted-foreground">Can create and edit layouts</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="viewer" className="p-3">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/20 p-1.5 rounded">
                  <Eye className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-sm">Viewer</div>
                  <div className="text-xs text-muted-foreground">View layouts and add comments</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="member" className="p-3">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-gray-900/20 p-1.5 rounded">
                  <Users className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <div className="font-medium text-sm">Member</div>
                  <div className="text-xs text-muted-foreground">Basic collaboration access</div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Layout Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Assign Specific Layout *</Label>
        </div>
        <Select 
          value={selectedLayout?.id?.toString() || ""} 
          onValueChange={(value) => {
            const layout = publicLayouts.find(l => l.id.toString() === value);
            setSelectedLayout(layout || null);
          }}
        >
          <SelectTrigger className="h-12 border-2 border-dashed border-muted-foreground/20 hover:border-primary/40">
            <SelectValue placeholder="Select layout (required)" />
          </SelectTrigger>
          <SelectContent>
            {publicLayouts
              .filter((layout, index, arr) => {
                // Keep only unique layouts by title and id combination
                return arr.findIndex(l => l.id === layout.id) === index;
              })
              .map((layout: GeneratedLayout) => {
              // Format version display: v1.0 for original, v1.1, v1.2 etc for versions
              const versionDisplay = layout.parentLayoutId 
                ? `v${layout.versionNumber || '1.1'}` 
                : 'v1.0';
              
              return (
                <SelectItem key={layout.id} value={layout.id.toString()} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1.5 rounded">
                      <Layout className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{layout.title} {versionDisplay}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-60">
                        {layout.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>



      {/* Auto-bind Categories and Tags Info */}
      {selectedLayout && (
        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-primary" />
            <div className="text-sm font-medium text-primary">Layout Details</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-medium text-muted-foreground min-w-20">Title:</span>
              <span>{selectedLayout.title}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-muted-foreground min-w-20">Description:</span>
              <span className="text-muted-foreground">{selectedLayout.description || "No description"}</span>
            </div>
            {selectedLayout.categoryId && (
              <div className="flex items-start gap-2">
                <span className="font-medium text-muted-foreground min-w-20">Category:</span>
                <span>{categories.find(c => c.id === selectedLayout.categoryId)?.name || "Unknown"}</span>
              </div>
            )}
            <div className="mt-3 p-2 bg-primary/5 rounded text-xs text-primary/80">
              💡 Categories and tags will be automatically available to the team member
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Personal Message (Optional)</Label>
        </div>
        <Textarea
          placeholder="Add a personal message for the invitation... (e.g., 'Looking forward to collaborating on this project!')"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="resize-none border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 focus:border-primary/60"
        />
      </div>

      {/* Send Invitation Button */}
      <div className="pt-4 border-t border-muted-foreground/20">
        <Button 
          onClick={handleSendInvitation}
          disabled={!selectedUser || !selectedLayout || inviteUserMutation.isPending}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base"
          size="lg"
        >
          {inviteUserMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
              Sending Invitation...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Invitation
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}

// Team Invitations Component
function TeamInvitations({ onAcceptInvitation }: { onAcceptInvitation?: (layoutId?: number) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's pending invitations
  const { data: invitations = [], isLoading, error, refetch } = useQuery<TeamInvitation[]>({
    queryKey: ["/api/invitations"],
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true
  });

  // Debug logging removed for production

  const respondToInvitationMutation = useMutation({
    mutationFn: ({ invitationId, status }: { invitationId: number; status: string }) =>
      apiRequest("POST", `/api/invitations/${invitationId}/respond`, { status }),
    onSuccess: (invitation, variables) => {
      const action = variables.status === "accepted" ? "accepted" : "declined";
      toast({ title: `Invitation ${action} successfully!` });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      
      // If invitation was accepted, automatically switch to versions tab and select the layout
      if (variables.status === "accepted") {
        // Switch to versions tab immediately
        setActiveTab("versions");
        
        // Auto-select the layout from the invitation
        const acceptedInvitation = invitation as any;
        if (acceptedInvitation.layoutId) {
          setSelectedLayout(acceptedInvitation.layoutId);
        }
        
        // Refresh data to get the latest shared layouts
        queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/accepted-invitations"] });
      }
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

  if (isLoading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading invitations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-red-500 mb-2">Failed to load invitations</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Mail className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Pending Invitations</h4>
          <p className="text-xs text-muted-foreground">
            {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-3">
        {invitations.map((invitation: TeamInvitation) => (
        <Card key={invitation.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-medium text-sm">
                  Invitation from {invitation.inviterUsername || 'Unknown User'}
                </div>
                <Badge variant="outline" className="text-xs">{invitation.role}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Team: <span className="font-medium">{invitation.teamName}</span>
                {invitation.layoutTitle && (
                  <span> • Layout: <span className="font-medium">{invitation.layoutTitle}</span></span>
                )}
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
    </div>
  );
}

interface ProjectManagementProps {
  onSelectLayout: (layout: GeneratedLayout) => void;
  currentLayout?: GeneratedLayout;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
}

export function ProjectManagement({ onSelectLayout, currentLayout, defaultTab = "organization", onTabChange }: ProjectManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for dialogs and forms
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [tagDialog, setTagDialog] = useState(false);
  const [teamDialog, setTeamDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [teamSharedLayouts, setTeamSharedLayouts] = useState<GeneratedLayout[]>([]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };
  const [inviteDialog, setInviteDialog] = useState<number | null>(null);
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



  // Query for accepted invitations to get shared layouts with permissions
  const { data: acceptedInvitations = [] } = useQuery({
    queryKey: ["/api/accepted-invitations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/accepted-invitations");
      return response.json();
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Get shared layouts from accepted invitations
  const sharedLayoutsFromTeams = acceptedInvitations.map(invitation => ({
    id: invitation.layoutId,
    role: invitation.role,
    teamName: invitation.teamName,
    teamId: invitation.teamId,
    invitationId: invitation.id
  })).filter(item => item.id); // Only include invitations with valid layoutId

  // Query for actual layout data for shared layouts
  const { data: teamSharedLayoutsData = [] } = useQuery({
    queryKey: ["/api/shared-layouts", sharedLayoutsFromTeams],
    queryFn: async () => {
      const layouts = [];
      for (const sharedLayout of sharedLayoutsFromTeams) {
        try {
          const layoutResponse = await apiRequest("GET", `/api/layouts/${sharedLayout.id}`);
          const layout = await layoutResponse.json();
          layouts.push({
            ...layout,
            sharedRole: sharedLayout.role,
            sharedTeamName: sharedLayout.teamName,
            sharedTeamId: sharedLayout.teamId
          });
        } catch (error) {
          console.log(`Could not fetch shared layout ${sharedLayout.id}`);
        }
      }
      return layouts;
    },
    enabled: sharedLayoutsFromTeams.length > 0,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true
  });

  // Temporarily disable shared layouts query to prevent NaN error
  const sharedLayouts: SharedLayout[] = [];

  // Add layouts query for version control
  const { data: layouts = [] } = useQuery<GeneratedLayout[]>({
    queryKey: ["/api/layouts"],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });





  // Get base layouts for dropdown - include own layouts and team shared layouts
  const uniqueLayouts = [...layouts, ...teamSharedLayouts, ...teamSharedLayoutsData].filter((layout: GeneratedLayout, index, arr) => 
    !layout.parentLayoutId && 
    !layout.title.startsWith("Improved:") &&
    arr.findIndex(l => l.id === layout.id) === index // Remove duplicates
  );

  // Effect to auto-select layout in output panel when selectedLayout changes
  useEffect(() => {
    if (selectedLayout && onSelectLayout) {
      const layout = uniqueLayouts.find(l => l.id === parseInt(selectedLayout));
      if (layout) {
        onSelectLayout(layout);
      }
    }
  }, [selectedLayout, uniqueLayouts, onSelectLayout]);

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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="collaborate">Teams</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="p-4 space-y-4">
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
                    <DialogDescription>
                      Create a new category to organize your layouts with a custom color.
                    </DialogDescription>
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
                    <DialogDescription>
                      Create a new tag to categorize and filter your layouts.
                    </DialogDescription>
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
                          <DialogDescription>
                            Select a tag to assign to this layout for better organization.
                          </DialogDescription>
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
                  {uniqueLayouts.map((layout: GeneratedLayout) => {
                    // Determine version display
                    const versionDisplay = layout.parentLayoutId 
                      ? `v${layout.versionNumber || '1.1'}` 
                      : 'v1.0';
                    
                    return (
                      <SelectItem key={layout.id} value={layout.id.toString()}>
                        {layout.title} {versionDisplay}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedLayout && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Version History
                    {(() => {
                      const currentLayout = uniqueLayouts.find(l => l.id === parseInt(selectedLayout));
                      if (currentLayout?.sharedRole) {
                        return (
                          <Badge variant="outline" className="ml-auto text-xs">
                            {currentLayout.sharedRole === 'viewer' && '👁️ View Only'}
                            {currentLayout.sharedRole === 'editor' && '✏️ Can Edit'}
                            {currentLayout.sharedRole === 'admin' && '⚡ Full Access'}
                          </Badge>
                        );
                      }
                      return null;
                    })()}
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                My Teams
              </CardTitle>
              <Dialog open={teamDialog} onOpenChange={setTeamDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Create
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                    <DialogDescription>
                      Create a team to collaborate on layouts with other users.
                    </DialogDescription>
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
            <CardContent className="pt-2">
              <div className="space-y-3">
                {teams.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No teams yet. Create your first team!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teams.map((team: Team) => (
                      <Card key={team.id} className="border border-muted-foreground/20 hover:border-primary/40 transition-colors bg-card">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="bg-primary/10 p-1.5 rounded">
                                <Users className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-sm truncate text-foreground">{team.name || 'Unnamed Team'}</h3>
                                  <Badge variant="outline" className="text-xs shrink-0">Admin</Badge>
                                </div>
                                {team.description && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {team.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="secondary" className="text-xs">
                                {team.memberCount || 0} member{(team.memberCount || 0) !== 1 ? 's' : ''}
                              </Badge>
                              <Dialog open={inviteDialog === team.id} onOpenChange={(open) => setInviteDialog(open ? team.id : null)}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-8 px-3">
                                    <UserPlus className="h-3.5 w-3.5" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Invite Team Members - {team.name}</DialogTitle>
                                    <DialogDescription>
                                      Search and invite users to join your team with specific roles and layout permissions.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <TeamInvitationInterface 
                                    team={team} 
                                    onClose={() => setInviteDialog(null)}
                                  />
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Invitations Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TeamInvitations onAcceptInvitation={(layoutId) => {
                // Switch to versions tab and set the layout
                setActiveTab("versions");
                if (layoutId && onSelectLayout) {
                  // Fetch the layout and add it to shared layouts
                  queryClient.fetchQuery({
                    queryKey: ["/api/layouts", layoutId],
                    queryFn: () => apiRequest("GET", `/api/layouts/${layoutId}`)
                  }).then((layout: GeneratedLayout) => {
                    // Add to team shared layouts if not already present
                    setTeamSharedLayouts(prev => {
                      if (!prev.find(l => l.id === layout.id)) {
                        return [...prev, layout];
                      }
                      return prev;
                    });
                    // Set as selected layout and activate it
                    setSelectedLayout(layout.id);
                    onSelectLayout(layout);
                  }).catch((error) => {
                    console.error("Failed to fetch layout:", error);
                    toast({ 
                      title: "Failed to load shared layout", 
                      description: "The layout may no longer be available.", 
                      variant: "destructive" 
                    });
                  });
                }
              }} />
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