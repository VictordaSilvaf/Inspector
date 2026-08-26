import { Loader2, Monitor } from 'lucide-react';
import { motion } from 'motion/react';
import { API_HTTP_METHODS } from '@/components/base/ApiConsulting/auth';
import type { ApiHttpMethod } from '@/components/base/ApiConsulting/auth';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type ApiUrlMonitorProps = {
    apiUrl: string;
    httpMethod: ApiHttpMethod;
    error: string | null;
    isLoading: boolean;
    saveLabel?: string;
    onApiUrlChange: (value: string) => void;
    onHttpMethodChange: (value: ApiHttpMethod) => void;
    onSave: () => void;
};

function ApiUrlMonitor({
    apiUrl,
    httpMethod,
    error,
    isLoading,
    saveLabel = 'Salvar monitor',
    onApiUrlChange,
    onHttpMethodChange,
    onSave,
}: Readonly<ApiUrlMonitorProps>) {
    return (
        <motion.div
            className="content-box"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className='mb-10'>
                <p className="font-medium text-xl">API para monitorar</p>
                <p className="text-sm text-muted-foreground">
                    Informe a URL da API que deseja monitorar e o método HTTP que deseja utilizar.
                </p>
            </div>
            <div className="mt-4 mb-5 grid grid-cols-1 items-start gap-5">
                <div className="relative flex flex-1 flex-row gap-2">
                    <Select
                        value={httpMethod}
                        onValueChange={(value) =>
                            onHttpMethodChange(value as ApiHttpMethod)
                        }
                        disabled={isLoading}
                    >
                        <SelectTrigger
                            className="h-auto w-28 shrink-0 !text-xl py-6"
                            aria-label="Método HTTP"
                        >
                            <SelectValue placeholder="Método" />
                        </SelectTrigger>
                        <SelectContent>
                            {API_HTTP_METHODS.map((method) => (
                                <SelectItem key={method} value={method}>
                                    {method}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="url"
                        placeholder="https://api.exemplo.com"
                        value={apiUrl}
                        onChange={(e) => onApiUrlChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onSave();
                            }
                        }}
                        aria-invalid={error !== null}
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <InputError
                        className="absolute bottom-0 left-0 translate-y-full"
                        message={error ?? undefined}
                    />
                </div>
                <Button
                    variant="default"
                    className="flex !min-w-40 items-center gap-3 !px-6 py-6 text-lg cursor-pointer"
                    onClick={onSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : (
                        <Monitor className="size-5" />
                    )}
                    {saveLabel}
                </Button>
            </div>
        </motion.div>
    );
}

export { ApiUrlMonitor };
