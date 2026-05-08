# Grade 11 Mathematics — Topical Worksheet
## Topic 5: Vectors & Matrices
*Cambridge O-Level (4024) / IGCSE (0580) — Advanced / A* Exam Prep*

---

### 📘 Topic Concept

**Vectors** — quantities with both magnitude and direction; written as a column vector $\begin{pmatrix}x\\y\end{pmatrix}$ or with bold letter $\mathbf{a}$.

**Magnitude (length)** of $\mathbf{a}=\begin{pmatrix}x\\y\end{pmatrix}$: $|\mathbf{a}|=\sqrt{x^{2}+y^{2}}$.

**Vector addition / subtraction** is component-wise.

**Scalar multiple**: $k\mathbf{a}=\begin{pmatrix}kx\\ky\end{pmatrix}$.

**Position vector** of point $P$: $\overrightarrow{OP}$. Then $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$.

**Parallel vectors**: $\mathbf{a}\parallel\mathbf{b}$ ⇔ $\mathbf{a}=k\mathbf{b}$ for some scalar $k$.

**Matrices** — rectangular arrays of numbers. A $2\times 2$ matrix:

$$M=\begin{pmatrix}a&b\\c&d\end{pmatrix}$$

**Determinant**: $\det M=ad-bc$.

**Inverse** (if $\det M\neq 0$):

$$M^{-1}=\dfrac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$$

**Multiplication**:

$$\begin{pmatrix}a&b\\c&d\end{pmatrix}\begin{pmatrix}p\\q\end{pmatrix}=\begin{pmatrix}ap+bq\\cp+dq\end{pmatrix}$$

**Transformations as matrices** (about origin)
- Reflection in $x$-axis: $\begin{pmatrix}1&0\\0&-1\end{pmatrix}$.
- Reflection in $y$-axis: $\begin{pmatrix}-1&0\\0&1\end{pmatrix}$.
- Reflection in $y=x$: $\begin{pmatrix}0&1\\1&0\end{pmatrix}$.
- Rotation $90^{\circ}$ anticlockwise: $\begin{pmatrix}0&-1\\1&0\end{pmatrix}$.
- Enlargement, scale factor $k$: $\begin{pmatrix}k&0\\0&k\end{pmatrix}$.

---

### 📝 Questions  *(Total: 41 marks)*

**Question 1** *[3]*
$\mathbf{a}=\begin{pmatrix}3\\-4\end{pmatrix}$, $\mathbf{b}=\begin{pmatrix}-1\\2\end{pmatrix}$.
**(a)** Find $\mathbf{a}+\mathbf{b}$. *[1]*
**(b)** Find $2\mathbf{a}-3\mathbf{b}$. *[1]*
**(c)** Find $|\mathbf{a}|$. *[1]*

---

**Question 2** *[3]*
Points: $A(2,3)$, $B(8,7)$, $C(6,1)$.
Find:
**(a)** $\overrightarrow{AB}$ *[1]*
**(b)** $\overrightarrow{BC}$ *[1]*
**(c)** $|\overrightarrow{AC}|$ *[1]*

---

**Question 3** *[3]*
Given that $\overrightarrow{OA}=\begin{pmatrix}5\\2\end{pmatrix}$, $\overrightarrow{OB}=\begin{pmatrix}-1\\6\end{pmatrix}$, find the position vector of the midpoint $M$ of $AB$.

---

**Question 4** *[4]*
$M=\begin{pmatrix}3&5\\1&2\end{pmatrix}$.
**(a)** Find $\det M$. *[1]*
**(b)** Find $M^{-1}$. *[2]*
**(c)** Verify by computing $MM^{-1}$. *[1]*

---

**Question 5** *[4]*
$A=\begin{pmatrix}2&-1\\3&4\end{pmatrix}$ and $B=\begin{pmatrix}1&2\\-1&5\end{pmatrix}$.
**(a)** Find $A+B$. *[1]*
**(b)** Find $AB$. *[3]*

---

**Question 6** *[4]*
Solve the simultaneous equations using the matrix method:

$$2x+3y=8,\qquad x-y=1$$

---

**Question 7** *[4]*
Triangle $T$ has vertices $A(1,0)$, $B(3,0)$, $C(2,2)$.
The transformation matrix $\begin{pmatrix}0&-1\\1&0\end{pmatrix}$ is applied to each vertex.
**(a)** Find the image of each vertex. *[2]*
**(b)** Describe the transformation in words. *[2]*

---

**Question 8** *[4]*
$\overrightarrow{OA}=\begin{pmatrix}4\\-1\end{pmatrix}$, $\overrightarrow{OB}=\begin{pmatrix}-2\\5\end{pmatrix}$. Point $P$ divides $AB$ such that $AP:PB=1:2$.
Find $\overrightarrow{OP}$.

---

**Question 9** *[4]*
$ABCD$ is a parallelogram with $\overrightarrow{AB}=\mathbf{p}$ and $\overrightarrow{AD}=\mathbf{q}$. $M$ is the midpoint of $BC$.
**(a)** Express $\overrightarrow{AM}$ in terms of $\mathbf{p}$ and $\mathbf{q}$. *[2]*
**(b)** Express $\overrightarrow{DM}$ in terms of $\mathbf{p}$ and $\mathbf{q}$. *[2]*

---

**Question 10 — Investigation** *[8]*
Given $\overrightarrow{OA}=\begin{pmatrix}2\\1\end{pmatrix}$ and $\overrightarrow{OB}=\begin{pmatrix}6\\7\end{pmatrix}$.
**(a)** Find $\overrightarrow{AB}$. *[1]*
**(b)** $C$ is on the line $AB$ such that $\overrightarrow{AC}=\dfrac{1}{4}\overrightarrow{AB}$. Find $\overrightarrow{OC}$. *[3]*
**(c)** $D$ is on the line $AB$ extended beyond $B$ such that $|\overrightarrow{OD}|=2|\overrightarrow{OB}|$ and $\overrightarrow{OD}\parallel\overrightarrow{OB}$. Find $\overrightarrow{OD}$. *[2]*
**(d)** Calculate $|\overrightarrow{AB}|$. Give your answer in surd form. *[2]*

---

### ✅ Answer Key

**Q1.**
**(a)** $\boxed{\begin{pmatrix}2\\-2\end{pmatrix}}$.
**(b)** $2\mathbf{a}=\begin{pmatrix}6\\-8\end{pmatrix}$, $3\mathbf{b}=\begin{pmatrix}-3\\6\end{pmatrix}$, so $2\mathbf{a}-3\mathbf{b}=\boxed{\begin{pmatrix}9\\-14\end{pmatrix}}$.
**(c)** $|\mathbf{a}|=\sqrt{9+16}=\boxed{5}$.

---

**Q2.**
**(a)** $\overrightarrow{AB}=\begin{pmatrix}8-2\\7-3\end{pmatrix}=\boxed{\begin{pmatrix}6\\4\end{pmatrix}}$.
**(b)** $\overrightarrow{BC}=\begin{pmatrix}-2\\-6\end{pmatrix}$.
**(c)** $\overrightarrow{AC}=\begin{pmatrix}4\\-2\end{pmatrix}$, $|\overrightarrow{AC}|=\sqrt{16+4}=\sqrt{20}=\boxed{2\sqrt{5}}$.

---

**Q3.** $M=\dfrac{1}{2}\left(\overrightarrow{OA}+\overrightarrow{OB}\right)=\dfrac{1}{2}\begin{pmatrix}4\\8\end{pmatrix}=\boxed{\begin{pmatrix}2\\4\end{pmatrix}}$.

---

**Q4.**
**(a)** $\det M=3(2)-5(1)=\boxed{1}$.
**(b)** $M^{-1}=\dfrac{1}{1}\begin{pmatrix}2&-5\\-1&3\end{pmatrix}=\boxed{\begin{pmatrix}2&-5\\-1&3\end{pmatrix}}$.
**(c)** $MM^{-1}=\begin{pmatrix}3(2)+5(-1)&3(-5)+5(3)\\1(2)+2(-1)&1(-5)+2(3)\end{pmatrix}=\begin{pmatrix}1&0\\0&1\end{pmatrix}$ ✓.

---

**Q5.**
**(a)** $A+B=\boxed{\begin{pmatrix}3&1\\2&9\end{pmatrix}}$.
**(b)** $AB=\begin{pmatrix}2(1)+(-1)(-1)&2(2)+(-1)(5)\\3(1)+4(-1)&3(2)+4(5)\end{pmatrix}=\boxed{\begin{pmatrix}3&-1\\-1&26\end{pmatrix}}$.

---

**Q6.** Matrix form: $\begin{pmatrix}2&3\\1&-1\end{pmatrix}\begin{pmatrix}x\\y\end{pmatrix}=\begin{pmatrix}8\\1\end{pmatrix}$.

$\det=2(-1)-3(1)=-5$. Inverse $=\dfrac{1}{-5}\begin{pmatrix}-1&-3\\-1&2\end{pmatrix}=\dfrac{1}{5}\begin{pmatrix}1&3\\1&-2\end{pmatrix}$.

$$\begin{pmatrix}x\\y\end{pmatrix}=\dfrac{1}{5}\begin{pmatrix}1&3\\1&-2\end{pmatrix}\begin{pmatrix}8\\1\end{pmatrix}=\dfrac{1}{5}\begin{pmatrix}11\\6\end{pmatrix}=\boxed{\left(\dfrac{11}{5},\;\dfrac{6}{5}\right)}$$

---

**Q7.**
**(a)** Apply $\begin{pmatrix}0&-1\\1&0\end{pmatrix}$ to each:
$A(1,0)\to(0,1)$;  $B(3,0)\to(0,3)$;  $C(2,2)\to(-2,2)$.
$$\boxed{A'(0,1),\;B'(0,3),\;C'(-2,2)}$$
**(b)** Rotation about the origin, $90^{\circ}$ **anticlockwise**.

---

**Q8.** $\overrightarrow{OP}=\overrightarrow{OA}+\dfrac{1}{3}\overrightarrow{AB}=\overrightarrow{OA}+\dfrac{1}{3}(\overrightarrow{OB}-\overrightarrow{OA})=\dfrac{2}{3}\overrightarrow{OA}+\dfrac{1}{3}\overrightarrow{OB}$.

$$=\dfrac{2}{3}\begin{pmatrix}4\\-1\end{pmatrix}+\dfrac{1}{3}\begin{pmatrix}-2\\5\end{pmatrix}=\dfrac{1}{3}\begin{pmatrix}6\\3\end{pmatrix}=\boxed{\begin{pmatrix}2\\1\end{pmatrix}}$$

---

**Q9.**
**(a)** $\overrightarrow{AM}=\overrightarrow{AB}+\dfrac{1}{2}\overrightarrow{BC}=\mathbf{p}+\dfrac{1}{2}\mathbf{q}$ (since $\overrightarrow{BC}=\overrightarrow{AD}=\mathbf{q}$). $\boxed{\overrightarrow{AM}=\mathbf{p}+\tfrac{1}{2}\mathbf{q}}$.
**(b)** $\overrightarrow{DM}=\overrightarrow{AM}-\overrightarrow{AD}=\mathbf{p}+\dfrac{1}{2}\mathbf{q}-\mathbf{q}=\boxed{\mathbf{p}-\tfrac{1}{2}\mathbf{q}}$.

---

**Q10.**
**(a)** $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}=\boxed{\begin{pmatrix}4\\6\end{pmatrix}}$.

**(b)** $\overrightarrow{OC}=\overrightarrow{OA}+\dfrac{1}{4}\overrightarrow{AB}=\begin{pmatrix}2\\1\end{pmatrix}+\dfrac{1}{4}\begin{pmatrix}4\\6\end{pmatrix}=\begin{pmatrix}3\\\dfrac{5}{2}\end{pmatrix}=\boxed{\begin{pmatrix}3\\2.5\end{pmatrix}}$.

**(c)** $\overrightarrow{OD}=2\overrightarrow{OB}=2\begin{pmatrix}6\\7\end{pmatrix}=\boxed{\begin{pmatrix}12\\14\end{pmatrix}}$.

**(d)** $|\overrightarrow{AB}|=\sqrt{4^{2}+6^{2}}=\sqrt{52}=\boxed{2\sqrt{13}}$.

---

*End of Worksheet — Grade 11 / Topic 5 / Vectors & Matrices*
