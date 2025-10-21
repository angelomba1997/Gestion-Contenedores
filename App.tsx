
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { RequestForm } from './components/RequestForm';
import { RequestList } from './components/RequestList';
import { FilterControls } from './components/FilterControls';
import { Inventory } from './components/Inventory';
import { PendingDeliveries } from './components/PendingDeliveries';
import { FRACTIONS } from './constants';
import type { ContainerRequest, Filters, InventoryItem, RequestItemDetail, Fraction } from './types';
import { StatusEnum, RequestTypeEnum } from './types';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  Timestamp, 
  writeBatch,
  runTransaction
} from 'firebase/firestore';

const recalculateRequestStatuses = (
  allRequests: ContainerRequest[],
  currentInventory: InventoryItem[]
): ContainerRequest[] => {
  const tempInventory = new Map<string, number>();
  currentInventory.forEach(item => {
    const key = `${item.fractionId}-${item.capacity}`;
    tempInventory.set(key, item.quantity);
  });

  const completedRequests = allRequests.filter(req => req.statusId === StatusEnum.REALIZADO);
  const pendingRequests = allRequests.filter(req => req.statusId !== StatusEnum.REALIZADO);

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
    
    if (itemsToAdd.length === 0) {
        return { ...req, statusId: StatusEnum.EN_PREPARACION, statusDetail: undefined };
    }

    const isPossible = itemsToAdd.every(item => {
        const key = `${item.fractionId}-${item.capacity}`;
        return (tempInventory.get(key) ?? 0) >= item.count;
    });

    if (isPossible) {
        itemsToAdd.forEach(item => {
            const key = `${item.fractionId}-${item.capacity}`;
            const currentStock = tempInventory.get(key) ?? 0;
            tempInventory.set(key, currentStock - item.count);
        });
        return { ...req, statusId: StatusEnum.EN_PREPARACION, statusDetail: undefined };
    } else {
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
  const [requests, setRequests] = useState<ContainerRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [establishments, setEstablishments] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    fractionId: 'ALL',
    capacity: 'ALL',
    statusId: 'ALL',
    establishment: 'ALL',
  });
  const [activeView, setActiveView] = useState<View>('requests');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch establishments
      const estSnapshot = await getDocs(collection(db, 'establishments'));
      const estList = estSnapshot.docs.map(doc => doc.id).sort();
      
      const defaultExamples = ['Establecimiento A', 'Establecimiento B', 'Establecimiento C'];
      const establishmentSet = new Set([...defaultExamples, ...estList]);
      setEstablishments(Array.from(establishmentSet).sort());

      // Fetch inventory
      const invSnapshot = await getDocs(collection(db, 'inventory'));
      const invList: InventoryItem[] = invSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          fractionId: data.fractionId,
          capacity: data.capacity,
          quantity: data.quantity,
          lastUpdated: (data.lastUpdated as Timestamp).toDate().toISOString(),
        };
      });
      setInventory(invList);

      // Fetch requests
      const reqSnapshot = await getDocs(collection(db, 'requests'));
      const reqList: ContainerRequest[] = reqSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          establishment: data.establishment,
          items: data.items,
          statusId: data.statusId,
          statusDetail: data.statusDetail || undefined,
          date: (data.date as Timestamp).toDate().toISOString(),
          observations: data.observations,
        };
      });
      
      setRequests(recalculateRequestStatuses(reqList, invList));

    } catch (error) {
      console.error("Error fetching data from Firestore:", error);
      alert("Error al cargar los datos. Por favor, revise la consola para más detalles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImportEstablishments = useCallback(async (csvText: string) => {
    if (!csvText) return;
    const imported = csvText
      .split('\n')
      .map(row => {
          const firstColumn = row.split(',')[0];
          return firstColumn.replace(/;+/g, '').trim();
      })
      .filter(Boolean);

    try {
        const batch = writeBatch(db);
        imported.forEach(name => {
            const docRef = doc(db, 'establishments', name);
            batch.set(docRef, { name });
        });
        await batch.commit();
        alert(`${imported.length} establecimientos importados/actualizados con éxito.`);
        await fetchData();
    } catch (error) {
        console.error("Error importing establishments:", error);
        alert("Error al importar establecimientos.");
    }
  }, [fetchData]);

  const addRequest = useCallback(async (newRequest: Omit<ContainerRequest, 'id' | 'statusId'>) => {
    try {
        const requestWithTimestamp = {
            ...newRequest,
            date: Timestamp.fromDate(new Date(newRequest.date)),
            statusId: StatusEnum.EN_PREPARACION, 
        };
        await addDoc(collection(db, 'requests'), requestWithTimestamp);
        await fetchData();
    } catch (error) {
        console.error("Error adding request:", error);
        alert("Error al añadir la solicitud.");
    }
  }, [fetchData]);

  const deleteRequest = useCallback(async (idToDelete: string) => {
    try {
        await deleteDoc(doc(db, 'requests', idToDelete));
        await fetchData();
    } catch (error) {
        console.error("Error deleting request:", error);
        alert("Error al eliminar la solicitud.");
    }
  }, [fetchData]);

  const markRequestAsDelivered = useCallback(async (idToDeliver: string) => {
    const requestToDeliver = requests.find(req => req.id === idToDeliver);
    if (!requestToDeliver || requestToDeliver.statusId === StatusEnum.REALIZADO) return;

    try {
      await runTransaction(db, async (transaction) => {
        const requestDocRef = doc(db, "requests", idToDeliver);
        const requestDoc = await transaction.get(requestDocRef);
        if (!requestDoc.exists()) {
          throw new Error("¡La solicitud no existe!");
        }

        const requestData = requestDoc.data();
        const now = Timestamp.now();

        for (const item of requestData.items) {
          const invDocId = `${item.fractionId}-${item.capacity}`;
          const invDocRef = doc(db, "inventory", invDocId);
          const invDoc = await transaction.get(invDocRef);
          
          let newQuantity: number;
          if (invDoc.exists()) {
            const currentQuantity = invDoc.data().quantity;
            if (item.requestType === RequestTypeEnum.ADD) {
              newQuantity = Math.max(0, currentQuantity - 1);
            } else { // REMOVE
              newQuantity = currentQuantity + 1;
            }
            transaction.update(invDocRef, { quantity: newQuantity, lastUpdated: now });
          } else {
            if (item.requestType === RequestTypeEnum.ADD) {
              newQuantity = 0; 
            } else { // REMOVE
              newQuantity = 1;
            }
            transaction.set(invDocRef, { 
                fractionId: item.fractionId, 
                capacity: item.capacity, 
                quantity: newQuantity, 
                lastUpdated: now 
            });
          }
        }
        
        transaction.update(requestDocRef, { statusId: StatusEnum.REALIZADO, statusDetail: null });
      });
      
      await fetchData();

    } catch (e) {
      console.error("Transaction failed: ", e);
      alert("Error al marcar la solicitud como entregada. La operación fue revertida.");
    }
  }, [requests, fetchData]);


  const updateInventory = useCallback(async (updatedItem: Omit<InventoryItem, 'lastUpdated'>) => {
    try {
      const docId = `${updatedItem.fractionId}-${updatedItem.capacity}`;
      await setDoc(doc(db, 'inventory', docId), {
          ...updatedItem,
          lastUpdated: Timestamp.now()
      }, { merge: true });
      await fetchData();
    } catch(error) {
        console.error("Error updating inventory:", error);
        alert("Error al actualizar el inventario.");
    }
  }, [fetchData]);

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

    inventory.forEach(item => {
        const key = `${item.fractionId}-${item.capacity}`;
        availability.set(key, item.quantity);
    });

    const pendingRequests = requests.filter(req => req.statusId !== StatusEnum.REALIZADO);

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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-xl font-semibold text-slate-700">Cargando datos...</p>
        </div>
      </div>
    );
  }

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