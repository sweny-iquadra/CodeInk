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
  Filter
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
  const [versionForm, setVersionForm] = useState({
    versionNumber: "",
    changesDescription: ""
  });
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);

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

  const { data: currentLayoutTags = [] } = useQuery({
    queryKey: ["/api/layouts", currentLayout?.id, "tags"],
    queryFn: () => apiRequest("GET", `/api/layouts/${currentLayout?.id}/tags`),
    enabled: !!(currentLayout?.id && currentLayout.id > 0)
  });

  const { data: currentLayoutComments = [] } = useQuery({
    queryKey: ["/api/layouts", currentLayout?.id, "comments"],
    queryFn: () => apiRequest("GET", `/api/layouts/${currentLayout?.id}/comments`),
    enabled: !!(currentLayout?.id && currentLayout.id > 0)
  });

  const { data: layoutVersions = [] } = useQuery({
    queryKey: ["/api/layouts", selectedLayout, "versions"],
    queryFn: () => apiRequest("GET", `/api/layouts/${selectedLayout}/versions`),
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

  const createVersionMutation = useMutation({
    mutationFn: (data: { parentId: number; versionNumber: string; changesDescription: string }) => 
      apiRequest("POST", `/api/layouts/${data.parentId}/versions`, {
        versionNumber: data.versionNumber,
        changesDescription: data.changesDescription
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/layouts", selectedLayout, "versions"] });
      setVersionForm({ versionNumber: "", changesDescription: "" });
      setVersionDialogOpen(false);
      toast({ title: "Version created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating version",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreateVersion = () => {
    if (selectedLayout && versionForm.versionNumber && versionForm.changesDescription) {
      createVersionMutation.mutate({
        parentId: selectedLayout,
        versionNumber: versionForm.versionNumber,
        changesDescription: versionForm.changesDescription
      });
    }
  };

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
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {/* Count would come from a separate query */}
                      0
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                    className="text-xs cursor-pointer"
                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag.id) 
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  >
                    {tag.name}
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
                  <Label className="text-xs">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentLayoutTags.map((tag: TagType) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
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
              <Label className="text-sm">Select Layout for Version Control</Label>
              <Select 
                value={selectedLayout?.toString() || ""} 
                onValueChange={(value) => setSelectedLayout(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a layout..." />
                </SelectTrigger>
                <SelectContent>
                  {layouts.map((layout: GeneratedLayout) => (
                    <SelectItem key={layout.id} value={layout.id.toString()}>
                      {layout.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLayout && (
              <>
                <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <GitBranch className="h-4 w-4 mr-2" />
                      Create Version
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Version</DialogTitle>
                      <DialogDescription>
                        Create a new version of this layout to track changes and maintain version history.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="version-number">Version Number</Label>
                        <Input
                          id="version-number"
                          value={versionForm.versionNumber}
                          onChange={(e) => setVersionForm(prev => ({ ...prev, versionNumber: e.target.value }))}
                          placeholder="e.g., v1.1, v2.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="changes-description">Changes Description</Label>
                        <Textarea
                          id="changes-description"
                          value={versionForm.changesDescription}
                          onChange={(e) => setVersionForm(prev => ({ ...prev, changesDescription: e.target.value }))}
                          placeholder="Describe what changed in this version..."
                        />
                      </div>
                      <Button 
                        onClick={handleCreateVersion}
                        disabled={!versionForm.versionNumber || !versionForm.changesDescription || createVersionMutation.isPending}
                        className="w-full"
                      >
                        {createVersionMutation.isPending ? "Creating..." : "Create Version"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Version History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {console.log('layoutVersions:', layoutVersions, 'selectedLayout:', selectedLayout)}
                      {layoutVersions && layoutVersions.length > 0 ? (
                        layoutVersions.map((version: GeneratedLayout) => (
                          <div
                            key={version.id}
                            className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-accent"
                            onClick={() => onSelectLayout(version)}
                          >
                            <div>
                              <div className="font-medium text-sm">{version.versionNumber || 'No version number'}</div>
                              <div className="text-xs text-muted-foreground">{version.changesDescription || 'No description'}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(version.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No versions created yet. Create your first version above.
                          <br />
                          <small>Selected Layout: {selectedLayout} | Versions Count: {layoutVersions?.length || 0}</small>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
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

        <TabsContent value="collaborate" className="p-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Teams
              </CardTitle>
              <Dialog open={teamDialog} onOpenChange={setTeamDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="team-name">Name</Label>
                      <Input
                        id="team-name"
                        value={teamForm.name}
                        onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Design Team"
                      />
                    </div>
                    <div>
                      <Label htmlFor="team-description">Description</Label>
                      <Textarea
                        id="team-description"
                        value={teamForm.description}
                        onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                    <Button 
                      onClick={() => createTeamMutation.mutate(teamForm)}
                      disabled={!teamForm.name || createTeamMutation.isPending}
                      className="w-full"
                    >
                      Create Team
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teams.map((team: Team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div>
                      <div className="font-medium text-sm">{team.name}</div>
                      <div className="text-xs text-muted-foreground">{team.description}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {/* Member count would come from separate query */}
                      0 members
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shared Layouts */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Share className="h-4 w-4" />
                Shared with Me
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sharedLayouts.map((share: SharedLayout) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div className="text-sm">Shared Layout #{share.layoutId}</div>
                    <Badge variant="secondary" className="text-xs">
                      {share.permissions}
                    </Badge>
                  </div>
                ))}
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