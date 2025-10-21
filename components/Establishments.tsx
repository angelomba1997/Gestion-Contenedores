
import React, { useState, useRef } from 'react';
import { DocumentArrowUpIcon } from './icons/DocumentArrowUpIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface EstablishmentsProps {
    establishments: string[];
    onAdd: (name: string) => Promise<void>;
    onUpdate: (oldName: string, newName: string) => Promise<number | void>;
    onDelete: (name: string) => Promise<void>;
    onImport: (csvText: string) => Promise<void>;
}

interface EstablishmentRowProps {
    name: string;
    onUpdate: (oldName: string, newName: string) => Promise<number | void>;
    onDelete: (name: string) => Promise<void>;
}

const EstablishmentRow: React.FC<EstablishmentRowProps> = ({ name, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(name);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async () => {
        if (newName.trim() === name) {
            setIsEditing(false);
            return;
        }
        setIsLoading(true);
        try {
            const updatedCount = await onUpdate(name, newName.trim());
            alert(`"${name}" ha sido renombrado a "${newName.trim()}" y ${updatedCount || 0} solicitudes han sido actualizadas.`);
            setIsEditing(false);
        } catch (error) {
            alert(`Error al actualizar: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`¿Está seguro que desea eliminar "${name}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        setIsLoading(true);
        try {
            await onDelete(name);
            alert(`"${name}" ha sido eliminado.`);
        } catch (error) {
            alert(`Error al eliminar: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <li className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
            {isEditing ? (
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-grow p-2 border border-blue-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                />
            ) : (
                <span className="font-medium text-slate-700">{name}</span>
            )}
            <div className="flex items-center gap-2 ml-4">
                {isEditing ? (
                    <>
                        <button onClick={handleUpdate} disabled={isLoading} className="p-2 text-green-600 rounded-full hover:bg-green-100" aria-label="Guardar cambios">
                            <CheckIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsEditing(false)} disabled={isLoading} className="p-2 text-slate-500 rounded-full hover:bg-slate-200" aria-label="Cancelar edición">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsEditing(true)} disabled={isLoading} className="p-2 text-slate-500 rounded-full hover:bg-slate-200" aria-label="Editar establecimiento">
                            <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleDelete} disabled={isLoading} className="p-2 text-red-500 rounded-full hover:bg-red-100" aria-label="Eliminar establecimiento">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>
        </li>
    );
};

export const Establishments: React.FC<EstablishmentsProps> = ({ establishments, onAdd, onUpdate, onDelete, onImport }) => {
    const [newEstablishment, setNewEstablishment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onAdd(newEstablishment);
            setNewEstablishment('');
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (text) {
                setIsLoading(true);
                try {
                    await onImport(text);
                } catch(error) {
                    alert(`Error al importar: ${error.message}`);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
                <h2 className="text-2xl font-bold text-slate-700 border-b pb-3">Añadir Establecimiento</h2>
                <form onSubmit={handleAdd} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newEstablishment}
                        onChange={(e) => setNewEstablishment(e.target.value)}
                        placeholder="Nombre del nuevo establecimiento"
                        className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                        disabled={isLoading}
                        required
                    />
                    <button type="submit" className="px-4 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-slate-400" disabled={isLoading || !newEstablishment.trim()}>
                        Añadir
                    </button>
                </form>

                <div className="pt-6 border-t">
                    <h3 className="text-xl font-bold text-slate-700 mb-3">Subida Masiva</h3>
                    <p className="text-sm text-slate-500 mb-4">Importe una lista de establecimientos desde un archivo CSV. Solo se tendrá en cuenta la primera columna.</p>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".csv"
                        className="hidden"
                        disabled={isLoading}
                    />
                    <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-md hover:bg-slate-100 hover:border-slate-400 transition" disabled={isLoading}>
                        <DocumentArrowUpIcon className="w-6 h-6" />
                        Seleccionar archivo .csv
                    </button>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-slate-700 mb-4 border-b pb-3">Lista de Establecimientos</h2>
                {establishments.length > 0 ? (
                    <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                        {establishments.map(est => (
                            <EstablishmentRow
                                key={est}
                                name={est}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-slate-500 pt-8">No hay establecimientos registrados.</p>
                )}
            </div>
        </div>
    );
};
