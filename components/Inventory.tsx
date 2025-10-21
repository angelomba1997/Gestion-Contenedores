import React, { useState, useEffect } from 'react';
import { FRACTIONS } from '../constants';
import type { InventoryItem, Capacity } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface InventoryRowProps {
    fraction: typeof FRACTIONS[0];
    capacity: Capacity;
    inventoryItem?: InventoryItem;
    onUpdateInventory: (item: Omit<InventoryItem, 'lastUpdated'>) => void;
}

const InventoryRow: React.FC<InventoryRowProps> = ({ fraction, capacity, inventoryItem, onUpdateInventory }) => {
    const [quantity, setQuantity] = useState<number>(0);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    useEffect(() => {
        setQuantity(inventoryItem?.quantity ?? 0);
    }, [inventoryItem]);

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        const newQuantity = isNaN(value) || value < 0 ? 0 : value;
        setQuantity(newQuantity);
        setIsEditing(newQuantity !== (inventoryItem?.quantity ?? 0));
    };
    
    const handleSave = () => {
        onUpdateInventory({ fractionId: fraction.id, capacity, quantity });
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col p-3 border-b border-slate-200 last:border-b-0">
            <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`p-1.5 rounded-full ${fraction.color}`}>
                        <TrashIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className={`font-semibold ${fraction.textColor}`}>{fraction.name}</p>
                        <p className="text-xs text-slate-500">{capacity} Litros</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="w-24 p-2 border border-slate-300 rounded-md shadow-sm text-center focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                    />
                    <button
                        onClick={handleSave}
                        disabled={!isEditing}
                        className="px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                        aria-label={`Guardar cantidad para ${fraction.name} ${capacity}L`}
                    >
                        ✓
                    </button>
                </div>
            </div>
            {inventoryItem?.lastUpdated && (
                 <p className="text-xs text-slate-400 text-right mt-1">
                    Últ. act: {new Date(inventoryItem.lastUpdated).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                 </p>
            )}
        </div>
    );
}

interface InventoryProps {
    inventory: InventoryItem[];
    onUpdateInventory: (item: Omit<InventoryItem, 'lastUpdated'>) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ inventory, onUpdateInventory }) => {
    const allContainerTypes = FRACTIONS.flatMap(f =>
        f.capacities.map(c => ({
            fraction: f,
            capacity: c,
            key: `${f.id}-${c}`
        }))
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-slate-700 mb-6 border-b pb-3">Gestión de Inventario</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {allContainerTypes.map(({ fraction, capacity, key }) => {
                    const inventoryItem = inventory.find(
                        item => item.fractionId === fraction.id && item.capacity === capacity
                    );
                    return (
                        <InventoryRow
                            key={key}
                            fraction={fraction}
                            capacity={capacity}
                            inventoryItem={inventoryItem}
                            onUpdateInventory={onUpdateInventory}
                        />
                    );
                })}
            </div>
        </div>
    );
};