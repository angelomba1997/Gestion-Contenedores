

import React from 'react';
import { RequestItem } from './RequestItem';
import type { ContainerRequest } from '../types';

interface RequestListProps {
    requests: ContainerRequest[];
    onDeleteRequest: (id: string) => void;
    onMarkAsDelivered: (id: string) => void;
}

export const RequestList: React.FC<RequestListProps> = ({ requests, onDeleteRequest, onMarkAsDelivered }) => {
    if (requests.length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-slate-500">
                <p>No se encontraron solicitudes con los filtros actuales.</p>
            </div>
        );
    }
    return (
        <div className="space-y-4">
            {requests.map(request => (
                <RequestItem 
                    key={request.id} 
                    request={request} 
                    onDeleteRequest={onDeleteRequest} 
                    onMarkAsDelivered={onMarkAsDelivered}
                />
            ))}
        </div>
    );
};