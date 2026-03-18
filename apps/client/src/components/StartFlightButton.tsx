import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewFlightRequest } from "@try-catch/shared-types";
import { Rocket } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";

const StartFlightButton = () => {
	const navigate = useNavigate();

	const form = useForm({
		resolver: zodResolver(NewFlightRequest),
		defaultValues: {
			name: "",
		},
	});

	const onSubmit = useCallback(
		async (data: NewFlightRequest) => {
			const response = await request<NewFlightRequest, void>({
				path: "/flights/new",
				data,
			});

			if (response.result === "success") navigate(`/flight/active`);
		},
		[navigate],
	);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className="flex items-center gap-2">
					<Rocket />
					Start one
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Start new flight</DialogTitle>
					<DialogDescription />
				</DialogHeader>

				<Form {...form}>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Flight name</FormLabel>
								<FormControl>
									<Input
										value={field.value}
										onChange={field.onChange}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<DialogFooter>
						<Button
							onClick={form.handleSubmit(onSubmit)}
							className="flex items-center gap-2">
							<Rocket className="size-5" />
							Start flight
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default StartFlightButton;
