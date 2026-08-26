import { motion } from 'motion/react';

function CustomHeadersEmpty() {
    return (
        <motion.div
            key="empty-headers"
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{
                layout: {
                    type: 'spring',
                    stiffness: 420,
                    damping: 32,
                },
                opacity: { duration: 0.18 },
                y: { duration: 0.18 },
            }}
            className="rounded-md bg-muted p-4"
        >
            <p className="text-center text-sm text-muted-foreground">
                Nenhum header adicional. Clique em Adicionar se a API precisar.
            </p>
        </motion.div>
    );
}

export { CustomHeadersEmpty };
