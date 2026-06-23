import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Collection, CollectionItem, SavedRequest } from '@/types/collection';
import { generateId } from '@/lib/utils';

interface CollectionState {
  collections: Collection[];
  selectedCollectionId: string | null;
  selectedItemId: string | null;

  addCollection: (name: string, description?: string) => string;
  removeCollection: (id: string) => void;
  updateCollection: (id: string, updates: Partial<Pick<Collection, 'name' | 'description' | 'color' | 'icon'>>) => void;
  duplicateCollection: (id: string) => string;

  addFolder: (collectionId: string, name: string, parentId?: string) => string;
  addRequest: (collectionId: string, request: Omit<SavedRequest, 'id' | 'createdAt' | 'updatedAt'>, folderId?: string) => string;
  updateRequest: (collectionId: string, requestId: string, updates: Partial<SavedRequest>) => void;
  removeItem: (collectionId: string, itemId: string) => void;
  duplicateRequest: (collectionId: string, requestId: string) => void;

  setSelectedCollection: (id: string | null) => void;
  setSelectedItem: (id: string | null) => void;

  exportCollection: (id: string) => string;
  importCollection: (json: string) => void;

  findRequest: (requestId: string) => SavedRequest | null;
}

function findAndUpdateItem(
  items: CollectionItem[],
  targetId: string,
  updater: (item: CollectionItem) => CollectionItem
): CollectionItem[] {
  return items.map((item) => {
    if (item.id === targetId) return updater(item);
    if (item.children) {
      return { ...item, children: findAndUpdateItem(item.children, targetId, updater) };
    }
    return item;
  });
}

function findAndRemoveItem(items: CollectionItem[], targetId: string): CollectionItem[] {
  return items
    .filter((item) => item.id !== targetId)
    .map((item) =>
      item.children ? { ...item, children: findAndRemoveItem(item.children, targetId) } : item
    );
}

function flattenItems(items: CollectionItem[]): CollectionItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenItems(item.children) : [])]);
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      collections: [],
      selectedCollectionId: null,
      selectedItemId: null,

      addCollection: (name, description = '') => {
        const id = generateId();
        const now = Date.now();
        set((state) => ({
          collections: [
            ...state.collections,
            {
              id,
              name,
              description,
              color: '#3b82f6',
              icon: 'Folder',
              items: [],
              createdAt: now,
              updatedAt: now,
            },
          ],
          selectedCollectionId: id,
        }));
        return id;
      },

      removeCollection: (id) => {
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
          selectedCollectionId:
            state.selectedCollectionId === id ? null : state.selectedCollectionId,
        }));
      },

      updateCollection: (id, updates) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          ),
        }));
      },

      duplicateCollection: (id) => {
        const col = get().collections.find((c) => c.id === id);
        if (!col) return id;
        const newId = generateId();
        const now = Date.now();
        set((state) => ({
          collections: [
            ...state.collections,
            { ...col, id: newId, name: `${col.name} (Copy)`, createdAt: now, updatedAt: now },
          ],
        }));
        return newId;
      },

      addFolder: (collectionId, name, parentId) => {
        const folderId = generateId();
        const folder: CollectionItem = {
          id: folderId,
          type: 'folder',
          name,
          children: [],
          isExpanded: true,
        };

        set((state) => ({
          collections: state.collections.map((c) => {
            if (c.id !== collectionId) return c;
            if (!parentId) {
              return { ...c, items: [...c.items, folder], updatedAt: Date.now() };
            }
            return {
              ...c,
              items: findAndUpdateItem(c.items, parentId, (parent) => ({
                ...parent,
                children: [...(parent.children ?? []), folder],
              })),
              updatedAt: Date.now(),
            };
          }),
        }));
        return folderId;
      },

      addRequest: (collectionId, requestData, folderId) => {
        const requestId = generateId();
        const now = Date.now();
        const savedRequest: SavedRequest = {
          ...requestData,
          id: requestId,
          collectionId,
          folderId,
          createdAt: now,
          updatedAt: now,
        };
        const item: CollectionItem = {
          id: requestId,
          type: 'request',
          name: requestData.name,
          request: savedRequest,
        };

        set((state) => ({
          collections: state.collections.map((c) => {
            if (c.id !== collectionId) return c;
            if (!folderId) {
              return { ...c, items: [...c.items, item], updatedAt: Date.now() };
            }
            return {
              ...c,
              items: findAndUpdateItem(c.items, folderId, (folder) => ({
                ...folder,
                children: [...(folder.children ?? []), item],
              })),
              updatedAt: Date.now(),
            };
          }),
        }));
        return requestId;
      },

      updateRequest: (collectionId, requestId, updates) => {
        set((state) => ({
          collections: state.collections.map((c) => {
            if (c.id !== collectionId) return c;
            return {
              ...c,
              items: findAndUpdateItem(c.items, requestId, (item) => ({
                ...item,
                request: item.request ? { ...item.request, ...updates, updatedAt: Date.now() } : item.request,
              })),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      removeItem: (collectionId, itemId) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, items: findAndRemoveItem(c.items, itemId), updatedAt: Date.now() }
              : c
          ),
        }));
      },

      duplicateRequest: (collectionId, requestId) => {
        const col = get().collections.find((c) => c.id === collectionId);
        if (!col) return;
        const allItems = flattenItems(col.items);
        const item = allItems.find((i) => i.id === requestId);
        if (!item || !item.request) return;

        const newId = generateId();
        const now = Date.now();
        const newItem: CollectionItem = {
          ...item,
          id: newId,
          name: `${item.name} (Copy)`,
          request: { ...item.request, id: newId, name: `${item.request.name} (Copy)`, createdAt: now, updatedAt: now },
        };

        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, items: [...c.items, newItem], updatedAt: Date.now() }
              : c
          ),
        }));
      },

      setSelectedCollection: (id) => set({ selectedCollectionId: id }),
      setSelectedItem: (id) => set({ selectedItemId: id }),

      exportCollection: (id) => {
        const col = get().collections.find((c) => c.id === id);
        return col ? JSON.stringify(col, null, 2) : '{}';
      },

      importCollection: (json) => {
        try {
          const col = JSON.parse(json) as Collection;
          const now = Date.now();
          col.id = generateId();
          col.createdAt = now;
          col.updatedAt = now;
          set((state) => ({ collections: [...state.collections, col] }));
        } catch {
          // invalid JSON
        }
      },

      findRequest: (requestId) => {
        const { collections } = get();
        for (const col of collections) {
          const allItems = flattenItems(col.items);
          const item = allItems.find((i) => i.id === requestId);
          if (item?.request) return item.request;
        }
        return null;
      },
    }),
    { name: 'ibkr-collection-store' }
  )
);
