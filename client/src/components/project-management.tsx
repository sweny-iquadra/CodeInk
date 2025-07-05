import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

  // Form states
  const [categoryForm, setCategoryForm] = useState<CreateCategoryRequest>({
    name: "",
    color: "#8b5cf6",
    description: ""
  });
  const [tagForm, setTagForm] = useState<CreateTagRequest>({
    name: "",
    color: "#6b7280"
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
    queryKey: ["/api/teams"]
  });

  const { data: sharedLayouts = [] } = useQuery<SharedLayout[]>({
    queryKey: ["/api/layouts/shared"]
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/layouts/search", searchQuery, selectedCategory, selectedTags],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (selectedCategory) params.append("categoryId", selectedCategory.toString());
      if (selectedTags.length > 0) params.append("tagIds", selectedTags.join(","));
      
      return apiRequest(`/api/layouts/search?${params.toString()}`);
    },
    enabled: !!(searchQuery || selectedCategory || selectedTags.length > 0)
  });

  const { data: currentLayoutTags = [] } = useQuery({
    queryKey: ["/api/layouts", currentLayout?.id, "tags"],
    queryFn: () => apiRequest(`/api/layouts/${currentLayout?.id}/tags`),
    enabled: !!currentLayout?.id
  });

  const { data: currentLayoutComments = [] } = useQuery({
    queryKey: ["/api/layouts", currentLayout?.id, "comments"],
    queryFn: () => apiRequest(`/api/layouts/${currentLayout?.id}/comments`),
    enabled: !!currentLayout?.id
  });

  const { data: layoutVersions = [] } = useQuery({
    queryKey: ["/api/layouts", currentLayout?.id, "versions"],
    queryFn: () => apiRequest(`/api/layouts/${currentLayout?.id}/versions`),
    enabled: !!currentLayout?.id
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
          {currentLayout ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {layoutVersions.map((version: GeneratedLayout) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-accent"
                      onClick={() => onSelectLayout(version)}
                    >
                      <div>
                        <div className="font-medium text-sm">{version.versionNumber}</div>
                        <div className="text-xs text-muted-foreground">{version.changesDescription}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select a layout to view its version history
            </div>
          )}
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

            <div className="flex gap-2">
              <Select value={selectedCategory?.toString() || ""} onValueChange={(value) => setSelectedCategory(value ? parseInt(value) : null)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                  setSelectedTags([]);
                }}
              >
                Clear
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