'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Play, Square, FileText } from 'lucide-react';

interface Experiment {
    id: string;
    name: string;
    description: string;
    strategy_a: string;
    strategy_b: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    allocated_capital: number;
    split_ratio: number;
    start_time?: string;
    end_time?: string;
}

export default function ExperimentsPage() {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchExperiments();
    }, []);

    const fetchExperiments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/strategies/experiments');
            if (!response.ok) {
                throw new Error('Failed to fetch experiments');
            }
            const data = await response.json();
            setExperiments(data.experiments || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async (id: string) => {
        try {
            const response = await fetch(`/api/strategies/experiments/${id}/start`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to start experiment');
            }
            fetchExperiments();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleStop = async (id: string) => {
        try {
            const response = await fetch(`/api/strategies/experiments/${id}/stop`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to stop experiment');
            }
            fetchExperiments();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            'PENDING': 'secondary',
            'RUNNING': 'default',
            'COMPLETED': 'outline',
            'FAILED': 'destructive',
        };
        return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">A/B Testing Experiments</h1>
                    <p className="text-muted-foreground mt-2">
                        Compare strategy performance with controlled experiments
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Experiment
                </Button>
            </div>

            {error && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6">
                {experiments.map((exp) => (
                    <Card key={exp.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{exp.name}</CardTitle>
                                    <CardDescription className="mt-2">
                                        {exp.description}
                                    </CardDescription>
                                </div>
                                {getStatusBadge(exp.status)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">Strategy A</p>
                                    <p className="text-sm text-muted-foreground">{exp.strategy_a}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Strategy B</p>
                                    <p className="text-sm text-muted-foreground">{exp.strategy_b}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Capital</p>
                                    <p className="text-sm text-muted-foreground">
                                        ${exp.allocated_capital.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Split</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(exp.split_ratio * 100).toFixed(0)}% / {((1 - exp.split_ratio) * 100).toFixed(0)}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            {exp.status === 'PENDING' && (
                                <Button
                                    onClick={() => handleStart(exp.id)}
                                    variant="default"
                                    size="sm"
                                >
                                    <Play className="mr-2 h-4 w-4" />
                                    Start
                                </Button>
                            )}
                            {exp.status === 'RUNNING' && (
                                <Button
                                    onClick={() => handleStop(exp.id)}
                                    variant="destructive"
                                    size="sm"
                                >
                                    <Square className="mr-2 h-4 w-4" />
                                    Stop
                                </Button>
                            )}
                            {(exp.status === 'COMPLETED' || exp.status === 'RUNNING') && (
                                <Button
                                    onClick={() => window.location.href = `/experiments/${exp.id}/report`}
                                    variant="outline"
                                    size="sm"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Report
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {experiments.length === 0 && !loading && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground mb-4">
                            No experiments found. Create your first A/B test to compare strategies.
                        </p>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Experiment
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
