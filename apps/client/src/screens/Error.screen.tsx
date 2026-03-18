import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { Link } from "react-router";

type ErrorScreenProps = {
	title: string;
	details?: ReactNode;
	loader?: boolean;
	backAndHomeButtons?: boolean;
};

const ErrorScreen = ({ title, details, loader, backAndHomeButtons }: ErrorScreenProps) => {
	return (
		<div className="bg-background flex h-dvh w-dvw items-center justify-center px-6">
			<div className="relative w-full max-w-xl">
				<div className="bg-primary/15 absolute -top-12 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full blur-3xl" />
				<Card className="bg-card/70 border-border/60 relative overflow-hidden rounded-3xl border shadow-2xl">
					<div className="from-primary/10 to-primary/20 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent" />
					<CardHeader className="relative flex items-center gap-4">
						<img
							src="/logos/small.svg"
							className="border-primary size-12 rounded-full border"
						/>
						<CardTitle className="text-2xl">{title}</CardTitle>
						{loader && <Loader2 className="text-primary ml-auto size-8 animate-spin" />}
					</CardHeader>
					{details && <CardContent className="relative overflow-auto">{details}</CardContent>}
					{backAndHomeButtons && (
						<CardFooter className="relative justify-center gap-6">
							<Button
								variant="outline"
								asChild>
								<Link to="..">
									<ArrowLeft className="size-4" />
									Go Back
								</Link>
							</Button>
							<Button asChild>
								<Link to="/">
									<Home className="size-4" />
									Home
								</Link>
							</Button>
						</CardFooter>
					)}
				</Card>
			</div>
		</div>
	);
};

export default ErrorScreen;
