import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Eye, MoreHorizontal, Trash } from "lucide-react";
import { DatabaseMatch } from "@/utils/match/matchTypes";
import { convertToLegacyMatch } from '@/utils/match/matchTypeConversions';

interface MatchTableProps {
  matches: any[];
  onViewMatch?: (matchId: string) => void;
  onEditMatch?: (matchId: string) => void;
  onDeleteMatch?: (matchId: string) => void;
}

export function MatchTable({
  matches,
  onViewMatch,
  onEditMatch,
  onDeleteMatch,
}: MatchTableProps) {
  // Convert any PlayFab match objects to legacy format
  const legacyMatches: DatabaseMatch[] = matches.map((match) => {
    // If it's already a DatabaseMatch, just return it
    if (match.slots !== undefined) {
      return match as DatabaseMatch;
    }
    // Otherwise, convert it from PlayFab Match to DatabaseMatch
    return convertToLegacyMatch(match);
  });

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Players</TableHead>
            <TableHead>Entry Fee</TableHead>
            <TableHead>Prize</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {legacyMatches.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                No matches found
              </TableCell>
            </TableRow>
          )}
          {legacyMatches.map((match) => (
            <TableRow key={match.id}>
              <TableCell className="font-medium">#{match.id.substring(0, 8)}</TableCell>
              <TableCell>{match.type}</TableCell>
              <TableCell>{match.title}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    match.status === "upcoming"
                      ? "border-blue-500 text-blue-500"
                      : match.status === "active"
                      ? "border-green-500 text-green-500"
                      : match.status === "completed"
                      ? "border-gray-500 text-gray-500"
                      : "border-red-500 text-red-500"
                  }`}
                >
                  {match.status}
                </Badge>
              </TableCell>
              <TableCell>{match.start_time ? new Date(match.start_time).toLocaleString() : "N/A"}</TableCell>
              <TableCell>{`${match.slots_filled}/${match.slots}`}</TableCell>
              <TableCell>{match.entry_fee} coins</TableCell>
              <TableCell>{match.prize} coins</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => onViewMatch && onViewMatch(match.id)}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onEditMatch && onEditMatch(match.id)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit match
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteMatch && onDeleteMatch(match.id)}
                      className="cursor-pointer text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete match
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
