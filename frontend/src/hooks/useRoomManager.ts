import { useEffect } from 'react';
import { useProjectStore } from '../store/project.store';
import { roomService } from '../services/room.service';

export function useRoomManager() {
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);

  useEffect(() => {
    if (selectedProjectId) {
      // Leave all other rooms first to ensure we are only in the current one
      roomService.leaveAll();
      // Join the newly selected project
      roomService.joinProject(selectedProjectId);
    } else {
      // If no project is selected (e.g. logged out or on a generic page), leave all
      roomService.leaveAll();
    }

    return () => {
      // Cleanup on unmount if necessary, but usually we just want to leave when project changes
    };
  }, [selectedProjectId]);
}
