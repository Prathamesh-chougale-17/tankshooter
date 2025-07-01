"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface WorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

interface Viewport {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

interface Entities {
  tanks: Tank[];
  bullets: Bullet[];
  playerId: string;
}

interface MinimapProps {
  gameEngine: {
    getWorldBounds: () => WorldBounds;
    getPlayerViewport: () => Viewport | null;
    getAllEntities: () => Entities;
  } | null;
  className?: string;
}

interface Tank {
  id: string;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
}

interface Bullet {
  position: { x: number; y: number };
  ownerId: string;
}

export function Minimap({ gameEngine, className = "" }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!gameEngine || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateMinimap = () => {
      const worldBounds = gameEngine.getWorldBounds();
      const viewport = gameEngine.getPlayerViewport();
      const entities = gameEngine.getAllEntities();

      if (!worldBounds || !entities) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw world boundary
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Helper function to convert world coordinates to minimap coordinates
      const worldToMinimap = (worldX: number, worldY: number) => ({
        x: ((worldX - worldBounds.minX) / worldBounds.width) * canvas.width,
        y: ((worldY - worldBounds.minY) / worldBounds.height) * canvas.height,
      });

      // Draw player viewport rectangle
      if (viewport) {
        const viewportCorners = [
          worldToMinimap(
            viewport.centerX - viewport.width / 2,
            viewport.centerY - viewport.height / 2
          ),
          worldToMinimap(
            viewport.centerX + viewport.width / 2,
            viewport.centerY + viewport.height / 2
          ),
        ];

        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          viewportCorners[0].x,
          viewportCorners[0].y,
          viewportCorners[1].x - viewportCorners[0].x,
          viewportCorners[1].y - viewportCorners[0].y
        );
      }

      // Draw tanks
      entities.tanks.forEach((tank: Tank) => {
        const pos = worldToMinimap(tank.position.x, tank.position.y);

        // Different colors for player vs bots
        if (tank.id === entities.playerId) {
          ctx.fillStyle = "#00FF00"; // Green for player
        } else {
          ctx.fillStyle = tank.health > 0 ? "#FF8800" : "#666666"; // Orange for alive bots, gray for dead
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Add white outline
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw bullets (small dots)
      ctx.fillStyle = "#FFFF00";
      entities.bullets.forEach((bullet: Bullet) => {
        const pos = worldToMinimap(bullet.position.x, bullet.position.y);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Update minimap at 30 FPS
    const interval = setInterval(updateMinimap, 1000 / 30);

    return () => clearInterval(interval);
  }, [gameEngine]);

  return (
    <Card className={`bg-black/50 border-white/20 p-2 ${className}`}>
      <div className="text-white text-xs font-semibold mb-1 text-center">
        Minimap
      </div>
      <canvas
        ref={canvasRef}
        width={150}
        height={150}
        className="border border-gray-600 rounded"
        style={{
          width: "150px",
          height: "150px",
          imageRendering: "pixelated",
        }}
      />
      <div className="text-xs text-gray-400 mt-1 space-y-0.5">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>You</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          <span>Bots</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 border border-green-400"></div>
          <span>View</span>
        </div>
      </div>
    </Card>
  );
}
