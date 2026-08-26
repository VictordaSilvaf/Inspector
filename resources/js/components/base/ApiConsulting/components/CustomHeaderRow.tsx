import { Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { CustomHeader } from '@/components/base/ApiConsulting/auth';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CustomHeaderRowProps = {
    header: CustomHeader;
    keyError?: string;
    valueError?: string;
    isLoading: boolean;
    onUpdate: (id: string, field: 'key' | 'value', value: string) => void;
    onRemove: (id: string) => void;
    onStartRotating?: (id: string) => void;
    onCancelRotating?: (id: string) => void;
    onSubmit: () => void;
};

function CustomHeaderRow({
    header,
    keyError,
    valueError,
    isLoading,
    onUpdate,
    onRemove,
    onStartRotating,
    onCancelRotating,
    onSubmit,
}: Readonly<CustomHeaderRowProps>) {
    const showMaskedValue =
        header.configured === true
        && header.isSensitive === true
        && header.isRotating !== true;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{
                layout: {
                    type: 'spring',
                    stiffness: 420,
                    damping: 32,
                },
                opacity: { duration: 0.18 },
                y: { duration: 0.18 },
                scale: { duration: 0.18 },
            }}
            className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
            <div className="space-y-2">
                <Label htmlFor={`header-key-${header.id}`}>Nome</Label>
                <Input
                    id={`header-key-${header.id}`}
                    type="text"
                    placeholder="Accept"
                    value={header.key}
                    onChange={(e) => onUpdate(header.id, 'key', e.target.value)}
                    aria-invalid={keyError !== undefined}
                    disabled={isLoading}
                />
                <InputError message={keyError} />
            </div>

            <div className="space-y-2">
                <Label htmlFor={`header-value-${header.id}`}>Valor</Label>
                {showMaskedValue ? (
                    <div className="flex flex-col gap-2">
                        <p className="rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                            ••••••
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onStartRotating?.(header.id)}
                            disabled={isLoading}
                        >
                            Alterar valor
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Input
                            id={`header-value-${header.id}`}
                            type={header.isSensitive ? 'password' : 'text'}
                            placeholder="application/json"
                            value={header.value}
                            onChange={(e) =>
                                onUpdate(header.id, 'value', e.target.value)
                            }
                            aria-invalid={valueError !== undefined}
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onSubmit();
                                }
                            }}
                        />
                        {header.configured && onCancelRotating !== undefined && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="px-0"
                                onClick={() => onCancelRotating(header.id)}
                                disabled={isLoading}
                            >
                                Manter valor atual
                            </Button>
                        )}
                    </div>
                )}
                <InputError message={valueError} />
            </div>

            <div className="mt-1 flex h-full items-end justify-end">
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="w-full py-6 sm:size-12"
                    onClick={() => onRemove(header.id)}
                    disabled={isLoading}
                    aria-label="Remover header"
                >
                    <Trash2 className="size-5" />
                </Button>
            </div>
        </motion.div>
    );
}

export { CustomHeaderRow };
