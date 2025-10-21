import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { RequestForm } from './components/RequestForm';
import { RequestList } from './components/RequestList';
import { FilterControls } from './components/FilterControls';
import { Inventory } from './components/Inventory';
import { PendingDeliveries } from './components/PendingDeliveries';
import { INITIAL_REQUESTS, INITIAL_INVENTORY, FRACTIONS } from './constants';
import type { ContainerRequest, Filters, InventoryItem, RequestItemDetail, Fraction } from './types';
import { StatusEnum, RequestTypeEnum } from './types';

const recalculateRequestStatuses = (
  allRequests: ContainerRequest[],
  currentInventory: InventoryItem[]
): ContainerRequest[] => {
  // Use a Map for easier, more reliable inventory tracking during the calculation.
  const tempInventory = new Map<string, number>();
  currentInventory.forEach(item => {
    const key = `${item.fractionId}-${item.capacity}`;
    tempInventory.set(key, item.quantity);
  });

  const completedRequests = allRequests.filter(req => req.statusId === StatusEnum.REALIZADO);
  const pendingRequests = allRequests.filter(req => req.statusId !== StatusEnum.REALIZADO);

  // Sort pending requests by date, oldest first, to establish priority
  pendingRequests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const updatedPendingRequests = pendingRequests.map(req => {
    const aggregatedItems = req.items
        .filter(item => item.requestType === RequestTypeEnum.ADD)
        .reduce((acc, item) => {
            const key = `${item.fractionId}-${item.capacity}`;
            if (!acc[key]) {
                acc[key] = { ...item, count: 0 };
            }
            acc[key].count += 1;
            return acc;
        }, {} as Record<string, RequestItemDetail & { count: number }>);

    const itemsToAdd = Object.values(aggregatedItems);
    
    // For requests that only remove items, they are always "in preparation".
    if (itemsToAdd.length === 0) {
        return { ...req, statusId: StatusEnum.EN_PREPARACION, statusDetail: undefined };
    }

    // Check if the entire request is possible with the current temp inventory.
    const isPossible = itemsToAdd.every(item => {
        const key = `${item.fractionId}-${item.capacity}`;
        return (tempInventory.get(key) ?? 0) >= item.count;
    });

    if (isPossible) {
        // If possible, "reserve" the stock in our temporary inventory map.
        itemsToAdd.forEach(item => {
            const key = `${item.fractionId}-${item.capacity}`;
            const currentStock = tempInventory.get(key) ?? 0;
            tempInventory.set(key, currentStock - item.count);
        });
        return { ...req, statusId: StatusEnum.EN_PREPARACION, statusDetail: undefined };
    } else {
        // If not possible, generate a detailed status message.
        // Importantly, tempInventory is NOT modified for impossible requests.
        const statusDetails = itemsToAdd.map(item => {
            const key = `${item.fractionId}-${item.capacity}`;
            const availableQuantity = tempInventory.get(key) ?? 0;
            const requestedQuantity = item.count;
            const fraction = FRACTIONS.find(f => f.id === item.fractionId);
            const fractionName = fraction?.name ?? item.fractionId;

            if (availableQuantity < requestedQuantity) {
                return `No hay stock: ${fractionName} ${item.capacity}L (sol: ${requestedQuantity}, disp: ${availableQuantity})`;
            } else {
                return `Disponible: ${fractionName} ${item.capacity}L (sol: ${requestedQuantity}, disp: ${availableQuantity})`;
            }
        });
        
        return { 
            ...req, 
            statusId: StatusEnum.SIN_STOCK, 
            statusDetail: statusDetails.join(' | ')
        };
    }
  });

  return [...completedRequests, ...updatedPendingRequests];
};


type View = 'requests' | 'inventory' | 'pending';

export default function App() {
  const [requests, setRequests] = useState<ContainerRequest[]>(INITIAL_REQUESTS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [establishments, setEstablishments] = useState<string[]>(() => {
    const defaultExamples = ['Establecimiento A', 'Establecimiento B', 'Establecimiento C'];
    const establishmentSet = new Set([...defaultExamples, ...INITIAL_REQUESTS.map(req => req.establishment)]);
    return Array.from(establishmentSet).sort();
  });
  const [filters, setFilters] = useState<Filters>({
    fractionId: 'ALL',
    capacity: 'ALL',
    statusId: 'ALL',
    establishment: 'ALL',
  });
  const [activeView, setActiveView] = useState<View>('requests');

  const nextRequestId = useRef<number>(
    (() => {
        const existingIds = INITIAL_REQUESTS.map(r => parseInt(r.id, 10)).filter(id => !isNaN(id));
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        return maxId + 1;
    })()
  );

  useEffect(() => {
    // Recalculate statuses on initial load based on inventory and priority
    setRequests(prevRequests => recalculateRequestStatuses(prevRequests, inventory));
  }, []); // Empty dependency array means this runs once on mount

  const handleImportEstablishments = useCallback((csvText: string) => {
    if (!csvText) return;
    const imported = csvText
      .split('\n')
      .map(row => {
          const firstColumn = row.split(',')[0];
          return firstColumn.replace(/;+/g, '').trim(); // Clean up semicolons and trim
      })
      .filter(Boolean); // Filter out empty strings

    const defaultExamples = ['Establecimiento A', 'Establecimiento B', 'Establecimiento C'];

    setEstablishments(prev => {
      const filteredPrev = prev.filter(est => !defaultExamples.includes(est));
      const combined = [...filteredPrev, ...imported];
      const unique = Array.from(new Set(combined));
      return unique.sort();
    });
  }, []);

  const addRequest = useCallback((newRequest: Omit<ContainerRequest, 'id' | 'statusId'>) => {
    setRequests(currentRequests => {
      const requestWithMetadata: ContainerRequest = {
        ...newRequest,
        id: (nextRequestId.current++).toString(),
        statusId: StatusEnum.EN_PREPARACION, // Placeholder, will be recalculated
      };
      const newRequestsList = [requestWithMetadata, ...currentRequests];
      return recalculateRequestStatuses(newRequestsList, inventory);
    });
  }, [inventory]);

  const deleteRequest = useCallback((idToDelete: string) => {
    setRequests(currentRequests => {
        const updatedRequests = currentRequests.filter(req => req.id !== idToDelete);
        // Recalculate statuses as deleting a request might free up inventory
        return recalculateRequestStatuses(updatedRequests, inventory);
    });
  }, [inventory]);

  const markRequestAsDelivered = useCallback((idToDeliver: string) => {
    const requestToDeliver = requests.find(req => req.id === idToDeliver);
    if (!requestToDeliver || requestToDeliver.statusId === StatusEnum.REALIZADO) return;

    // Create a new inventory based on the delivery
    const newInventory: InventoryItem[] = JSON.parse(JSON.stringify(inventory));
    const now = new Date().toISOString();

    for (const item of requestToDeliver.items) {
      let stockItem = newInventory.find(inv => inv.fractionId === item.fractionId && inv.capacity === item.capacity);
      
      if (!stockItem) {
        stockItem = { fractionId: item.fractionId, capacity: item.capacity, quantity: 0, lastUpdated: now };
        newInventory.push(stockItem);
      }

      if (item.requestType === RequestTypeEnum.ADD) {
        stockItem.quantity = Math.max(0, stockItem.quantity - 1);
      } else if (item.requestType === RequestTypeEnum.REMOVE) {
        stockItem.quantity += 1;
      }
      stockItem.lastUpdated = now;
    }
    
    // Mark the request as delivered
    const requestsWithDelivered = requests.map(req => 
        req.id === idToDeliver ? { ...req, statusId: StatusEnum.REALIZADO, statusDetail: undefined } : req
    );
    
    // Recalculate statuses for all requests with the new inventory
    const finalRequests = recalculateRequestStatuses(requestsWithDelivered, newInventory);

    // Set both states
    setInventory(newInventory);
    setRequests(finalRequests);
  }, [requests, inventory]);

  const updateInventory = useCallback((updatedItem: Omit<InventoryItem, 'lastUpdated'>) => {
    setInventory(currentInventory => {
        const now = new Date().toISOString();
        let itemExists = false;
        const newInventory = currentInventory.map(item => {
          if (item.fractionId === updatedItem.fractionId && item.capacity === updatedItem.capacity) {
            itemExists = true;
            return { ...item, quantity: updatedItem.quantity, lastUpdated: now };
          }
          return item;
        });

        if (!itemExists) {
          newInventory.push({ ...updatedItem, lastUpdated: now });
        }
        
        // After inventory update, recalculate status for all requests
        setRequests(currentRequests => recalculateRequestStatuses(currentRequests, newInventory));
        
        return newInventory;
    });
  }, []);

  const filteredRequests = useMemo(() => {
    return requests
      .filter(req => filters.establishment === 'ALL' || req.establishment === filters.establishment)
      .filter(req => filters.statusId === 'ALL' || req.statusId === filters.statusId)
      .filter(req => {
        if (filters.fractionId === 'ALL') return true;
        return req.items.some(item => item.fractionId === filters.fractionId);
      })
      .filter(req => {
        if (filters.capacity === 'ALL') return true;
        return req.items.some(item => item.capacity === filters.capacity);
      })
      // sort by date desc to show newest first
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [requests, filters]);

  const pendingSummary = useMemo(() => {
    const summary: { [key: string]: { fraction: Fraction, capacity: number, [StatusEnum.EN_PREPARACION]: number, [StatusEnum.SIN_STOCK]: number } } = {};

    const pendingRequests = requests.filter(req => req.statusId !== StatusEnum.REALIZADO);

    for (const req of pendingRequests) {
        const itemsToAdd = req.items.filter(item => item.requestType === RequestTypeEnum.ADD);
        
        for (const item of itemsToAdd) {
            const key = `${item.fractionId}-${item.capacity}`;
            
            if (!summary[key]) {
                const fraction = FRACTIONS.find(f => f.id === item.fractionId);
                if (!fraction) continue;
                summary[key] = {
                    fraction,
                    capacity: item.capacity,
                    [StatusEnum.EN_PREPARACION]: 0,
                    [StatusEnum.SIN_STOCK]: 0,
                };
            }
            
            // Increment the count based on the request's status
            if (req.statusId === StatusEnum.EN_PREPARACION || req.statusId === StatusEnum.SIN_STOCK) {
                summary[key][req.statusId]++;
            }
        }
    }
    
    return Object.values(summary).sort((a, b) => 
      a.fraction.name.localeCompare(b.fraction.name) || a.capacity - b.capacity
    );
  }, [requests]);

  const realTimeAvailability = useMemo(() => {
    const availability = new Map<string, number>();

    // 1. Start with the base inventory
    inventory.forEach(item => {
        const key = `${item.fractionId}-${item.capacity}`;
        availability.set(key, item.quantity);
    });

    // 2. Find all pending requests
    const pendingRequests = requests.filter(req => req.statusId !== StatusEnum.REALIZADO);

    // 3. Subtract all ADD items from pending requests from the availability map
    for (const req of pendingRequests) {
        for (const item of req.items) {
            if (item.requestType === RequestTypeEnum.ADD) {
                const key = `${item.fractionId}-${item.capacity}`;
                const currentStock = availability.get(key) ?? 0;
                availability.set(key, currentStock - 1);
            }
        }
    }
    
    return availability;
  }, [requests, inventory]);


  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Header establishmentName="Gestión Central" />
      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-6 border-b border-slate-300">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveView('requests')}
              className={`py-3 px-4 font-semibold text-lg transition-colors duration-200 ${
                activeView === 'requests'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
              aria-current={activeView === 'requests' ? 'page' : undefined}
            >
              Solicitudes
            </button>
            <button
              onClick={() => setActiveView('pending')}
              className={`py-3 px-4 font-semibold text-lg transition-colors duration-200 ${
                activeView === 'pending'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
              aria-current={activeView === 'pending' ? 'page' : undefined}
            >
              Pendientes de Entrega
            </button>
            <button
              onClick={() => setActiveView('inventory')}
              className={`py-3 px-4 font-semibold text-lg transition-colors duration-200 ${
                activeView === 'inventory'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
              aria-current={activeView === 'inventory' ? 'page' : undefined}
            >
              Inventario
            </button>
          </nav>
        </div>

        {activeView === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <RequestForm 
                onSubmit={addRequest} 
                establishments={establishments} 
                onImportEstablishments={handleImportEstablishments}
                realTimeAvailability={realTimeAvailability}
              />
            </div>
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">Historial de Solicitudes</h2>
              <FilterControls filters={filters} setFilters={setFilters} establishments={establishments} />
              <RequestList 
                requests={filteredRequests} 
                onDeleteRequest={deleteRequest}
                onMarkAsDelivered={markRequestAsDelivered}
              />
            </div>
          </div>
        )}

        {activeView === 'pending' && (
          <PendingDeliveries summary={pendingSummary} />
        )}

        {activeView === 'inventory' && (
           <Inventory inventory={inventory} onUpdateInventory={updateInventory} />
        )}
      </main>
    </div>
  );
}