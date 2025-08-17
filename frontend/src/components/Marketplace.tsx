import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Download, Eye, DollarSign } from "lucide-react";

const Marketplace = () => {
  const featuredContent = [
    {
      id: 1,
      title: "Abstract Digital Art",
      creator: "0x4F99...2fBe",
      price: "$50.00",
      type: "Image",
      views: 1240,
      likes: 89,
      image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=300&fit=crop",
      tags: ["AI Training", "Commercial Use"]
    },
    {
      id: 2,
      title: "Synthwave Music Track",
      creator: "0x7A8B...5cDe",
      price: "$25.00",
      type: "Audio",
      views: 856,
      likes: 124,
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      tags: ["Background Music", "Attribution Required"]
    },
    {
      id: 3,
      title: "3D Spaceship Model",
      creator: "0x9C2D...8fGh",
      price: "$100.00",
      type: "3D Model",
      views: 567,
      likes: 67,
      image: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=300&fit=crop",
      tags: ["Game Development", "Commercial Use"]
    },
    {
      id: 4,
      title: "Poetry Collection",
      creator: "0x1E4F...9iJk",
      price: "Free",
      type: "Text",
      views: 923,
      likes: 156,
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
      tags: ["Open Source", "Attribution Required"]
    }
  ];

  const categories = [
    { name: "All", count: 1247, active: true },
    { name: "Images", count: 567 },
    { name: "Audio", count: 234 },
    { name: "3D Models", count: 123 },
    { name: "Text", count: 323 }
  ];

  return (
    <section id="marketplace" className="py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Content
            <span className="gradient-text"> Marketplace</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover and license high-quality creative content from verified creators worldwide.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((category) => (
            <Button
              key={category.name}
              variant={category.active ? "default" : "outline"}
              size="sm"
              className="flex items-center space-x-2"
            >
              <span>{category.name}</span>
              <Badge variant="secondary" className="text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredContent.map((item) => (
            <Card key={item.id} className="glass overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <div className="relative">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Quick Actions */}
                <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button size="icon" variant="glass" className="w-8 h-8">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="glass" className="w-8 h-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                {/* Type Badge */}
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="text-xs">
                    {item.type}
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold truncate">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">by {item.creator}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{item.views}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>{item.likes}</span>
                    </span>
                  </div>
                  <span className="font-semibold text-primary">{item.price}</span>
                </div>

                {/* License Button */}
                <Button 
                  variant={item.price === "Free" ? "success" : "default"} 
                  size="sm" 
                  className="w-full"
                >
                  <DollarSign className="h-4 w-4" />
                  {item.price === "Free" ? "Download Free" : "License Now"}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Content
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Marketplace;