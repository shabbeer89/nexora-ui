/**
 * Volume Profile Chart Component
 * Displays POC (Point of Control), VA (Value Area), and VWAP
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface VolumeProfileData {
    price: number;
    volume: number;
    isPOC: boolean;
    isVA: boolean;
}

export function VolumeProfileChart() {
    const [data, setData] = useState<VolumeProfileData[]>([]);
    const [poc, setPoc] = useState<number>(0);
    const [vah, setVah] = useState<number>(0);
    const [val, setVal] = useState<number>(0);
    const [vwap, setVwap] = useState<number>(0);

    useEffect(() => {
        // Fetch volume profile data from API
        const fetchData = async () => {
            try {
                const response = await fetch('/api/v1/analytics/volume-profile');
                const result = await response.json();

                setData(result.profile || []);
                setPoc(result.poc || 0);
                setVah(result.vah || 0);
                setVal(result.val || 0);
                setVwap(result.vwap || 0);
            } catch (error) {
                console.error('Failed to fetch volume profile:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Volume Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-muted-foreground">POC</div>
                            <div className="font-bold">${poc.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">VAH</div>
                            <div className="font-bold">${vah.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">VAL</div>
                            <div className="font-bold">${val.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">VWAP</div>
                            <div className="font-bold text-blue-600">${vwap.toFixed(2)}</div>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="number" dataKey="price" />
                            <Tooltip />
                            <Bar dataKey="volume" fill="#8884d8">
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fillOpacity={entry.isPOC ? 1 : entry.isVA ? 0.7 : 0.4}
                                    />
                                ))}
                            </Bar>
                            <ReferenceLine y={poc} stroke="red" strokeWidth={2} label="POC" />
                            <ReferenceLine y={vwap} stroke="blue" strokeWidth={2} label="VWAP" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
