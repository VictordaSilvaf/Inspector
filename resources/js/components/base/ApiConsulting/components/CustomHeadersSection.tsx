import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { CustomHeader } from '@/components/base/ApiConsulting/auth';
import { CustomHeaderRow } from '@/components/base/ApiConsulting/components/CustomHeaderRow';
import { CustomHeadersEmpty } from '@/components/base/ApiConsulting/components/CustomHeadersEmpty';
import type { CustomHeaderErrors } from '@/components/base/ApiConsulting/schema';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';

type CustomHeadersSectionProps = {
    customHeaders: CustomHeader[];
    customHeaderErrors: CustomHeaderErrors;
    isLoading: boolean;
    onAdd: () => void;
    onRemove: (id: string) => void;
    onUpdate: (id: string, field: 'key' | 'value', value: string) => void;
    onSubmit: () => void;
};

function CustomHeadersSection({
    customHeaders,
    customHeaderErrors,
    isLoading,
    onAdd,
    onRemove,
    onUpdate,
    onSubmit,
}: Readonly<CustomHeadersSectionProps>) {
    return (
        <motion.div className="content-box" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.5, ease: 'easeInOut', when: 'afterChildren', delay: 0.25 }}>
            <div className="flex items-start justify-between gap-4 mb-5">
                <div className=''>
                    <p className="font-medium text-xl">Headers adicionais</p>
                    <p className="text-sm text-muted-foreground">
                        Adicione headers extras enviados na requisição (ex.:
                        Accept, Content-Type).
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 gap-2"
                    onClick={onAdd}
                    disabled={isLoading}
                >
                    <Plus className="size-4" />
                    Adicionar
                </Button>
            </div>

            <InputError message={customHeaderErrors.form} />

            <div className="relative flex flex-col gap-10 divide-solid">
                <AnimatePresence mode="popLayout" initial={false}>
                    {customHeaders.map((header) => (
                        <CustomHeaderRow
                            key={header.id}
                            header={header}
                            keyError={
                                customHeaderErrors.fields?.[header.id]?.key
                            }
                            valueError={
                                customHeaderErrors.fields?.[header.id]?.value
                            }
                            isLoading={isLoading}
                            onUpdate={onUpdate}
                            onRemove={onRemove}
                            onSubmit={onSubmit}
                        />
                    ))}

                    {customHeaders.length === 0 && <CustomHeadersEmpty />}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export { CustomHeadersSection };
